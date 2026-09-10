//! Stands up a local Spark operator cluster and holds it open, printing the
//! config the browser needs to reach it and serving the funding a wallet cannot
//! do for itself here.
//!
//! The cluster comes from the sdk's own test fixtures, so it is the same one the
//! sdk tests against rather than a second implementation of it.

use std::io::Write;
use std::sync::Arc;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

use anyhow::Result;
use bip39::Mnemonic;
use serde_json::json;
use spark_itest::fixtures::setup::{TestFixtures, create_test_signer_alice};
use spark_itest::helpers::deposit_with_amount;
use spark_wallet::{Network, SparkAddress, SparkSignerAdapter, SparkWallet, identity_public_key};
use std::str::FromStr;

/// The phrase the local-regtest docs tell you to restore in the app.
const DEFAULT_FUND_MNEMONIC: &str =
    "legal winner thank year wave sausage worth useful legal winner thank yellow";

/// The regtest Spark address a phrase owns.
fn spark_address_of(phrase: &str) -> Result<String> {
    let seed = Mnemonic::from_str(phrase.trim())?.to_seed("");
    let address = SparkAddress {
        identity_public_key: identity_public_key(&seed, Network::Regtest, None)?,
        network: Network::Regtest,
        spark_invoice_fields: None,
    };
    Ok(address.to_address_string()?)
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,testcontainers=warn".into()),
        )
        .init();

    eprintln!("Starting cluster (bitcoind + postgres + 3 operators)...");
    let fixtures = TestFixtures::new().await?;

    let operators: Vec<_> = fixtures
        .spark_so
        .operators
        .iter()
        .map(|op| {
            json!({
                "id": op.index,
                "identifier": hex::encode(op.identifier.serialize()),
                "address": format!("https://127.0.0.1:{}", op.host_port),
                "identityPublicKey": hex::encode(op.public_key.serialize()),
                "caCertPem": op.ca_cert,
            })
        })
        .collect();

    let coordinator = &fixtures.spark_so.operators[0];
    let config = json!({
        "coordinatorIdentifier": hex::encode(coordinator.identifier.serialize()),
        "threshold": spark_itest::fixtures::spark_so::MIN_SIGNERS,
        "signingOperators": operators,
        "sspConfig": {
            "baseUrl": "",
            "identityPublicKey": hex::encode([2u8; 33]),
            "schemaEndpoint": null,
        },
        "expectedWithdrawBondSats": 10000,
        "expectedWithdrawRelativeBlockLocktime": 1000,
        "bitcoind": {
            "rpcUrl": fixtures.bitcoind.rpc_url,
            "rpcUser": fixtures.bitcoind.rpcuser,
            "rpcPassword": fixtures.bitcoind.rpcpassword,
        },
    });

    // A wallet in the browser cannot claim its own deposit here: that path runs
    // through a service provider, which a local cluster does not have. Funding
    // it means depositing with a wallet that can, then sending a Spark transfer.
    let wallet_config = fixtures.create_wallet_config().await?;
    let funder = SparkWallet::connect(
        wallet_config,
        Arc::new(SparkSignerAdapter::new(
            Arc::new(create_test_signer_alice()),
        )),
    )
    .await?;
    // `deposit_with_amount` waits for a DepositConfirmed event, which only
    // arrives once the wallet is processing the operators' event stream.
    funder.start_background_processing().await;

    // The address is derived from the phrase the app will be restored with, so
    // the cluster funds a wallet that does not exist yet and nobody has to start
    // it twice. FUND_SPARK_ADDRESS still wins if you already have an address.
    let default_target = match std::env::var("FUND_SPARK_ADDRESS") {
        Ok(address) => address,
        Err(_) => spark_address_of(
            &std::env::var("FUND_MNEMONIC").unwrap_or_else(|_| DEFAULT_FUND_MNEMONIC.to_string()),
        )?,
    };
    let startup_rounds: u32 = std::env::var("FUND_COUNT")
        .unwrap_or_else(|_| "0".to_string())
        .parse()?;
    let default_sats: u64 = std::env::var("FUND_SATS")
        .unwrap_or_else(|_| "1000000".to_string())
        .parse()?;
    if startup_rounds > 0 {
        fund(
            &funder,
            &fixtures,
            &default_target,
            default_sats,
            startup_rounds,
        )
        .await?;
    }

    let rendered = serde_json::to_string_pretty(&config)?;
    let out = std::env::var("REGTEST_CONFIG_OUT")
        .unwrap_or_else(|_| "/tmp/spark-regtest.json".to_string());
    std::fs::File::create(&out)?.write_all(rendered.as_bytes())?;

    println!("{rendered}");
    eprintln!("\nCluster up. Config written to {out}");
    let port: u16 = std::env::var("FUND_PORT")
        .unwrap_or_else(|_| "8997".to_string())
        .parse()?;
    let listener = TcpListener::bind(("127.0.0.1", port)).await?;
    eprintln!("Fund on demand: curl 'http://127.0.0.1:{port}/fund?sats=200000&count=3'");
    eprintln!("Press Ctrl-C to tear down.\n");

    loop {
        tokio::select! {
            _ = tokio::signal::ctrl_c() => break,
            accepted = listener.accept() => {
                let (stream, _) = accepted?;
                // One at a time: funding drives the one funder wallet, and two
                // deposits racing through it would interleave their syncs.
                if let Err(e) = serve(stream, &funder, &fixtures, &default_target, default_sats).await {
                    eprintln!("fund request failed: {e}");
                }
            }
        }
    }
    eprintln!("Shutting down.");
    Ok(())
}

/// Deposits `sats` and forwards it to `target`, once per round. Each round lands
/// as its own leaf in the receiver: leaf optimization is off, so nothing merges
/// them afterwards.
async fn fund(
    funder: &SparkWallet,
    fixtures: &TestFixtures,
    target: &str,
    sats: u64,
    rounds: u32,
) -> Result<()> {
    eprintln!("Funding {target} with {rounds} x {sats} sats...");
    let address = SparkAddress::from_str(target)?;
    for round in 1..=rounds {
        // Deposit exactly what is being sent: a transfer for less than the whole
        // leaf has nothing to split it with.
        deposit_with_amount(funder, &fixtures.bitcoind, sats).await?;
        // The claimed leaf is not spendable until the wallet has synced it.
        for _ in 0..30 {
            funder.sync().await?;
            if funder.get_balance().await? >= sats {
                break;
            }
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        }
        let transfer = funder.transfer(sats, &address, None).await?;
        eprintln!(
            "Round {round}/{rounds}: transferred {sats} sats ({:?})",
            transfer.id
        );
    }
    Ok(())
}

/// Enough of a query-string decode for the one value that carries spaces.
fn percent_decode(value: &str) -> String {
    let bytes = value.replace('+', " ").into_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        match (bytes[i], bytes.get(i + 1), bytes.get(i + 2)) {
            (b'%', Some(hi), Some(lo)) => {
                match u8::from_str_radix(&format!("{}{}", *hi as char, *lo as char), 16) {
                    Ok(byte) => {
                        out.push(byte);
                        i += 3;
                    }
                    Err(_) => {
                        out.push(bytes[i]);
                        i += 1;
                    }
                }
            }
            _ => {
                out.push(bytes[i]);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).into_owned()
}

/// Answers one `GET /fund?sats=&count=&address=|mnemonic=` request. Bare enough to need no
/// http server: the only client is a test runner on this machine.
async fn serve(
    mut stream: tokio::net::TcpStream,
    funder: &SparkWallet,
    fixtures: &TestFixtures,
    default_target: &str,
    default_sats: u64,
) -> Result<()> {
    let mut buf = [0u8; 2048];
    let read = stream.read(&mut buf).await?;
    let request = String::from_utf8_lossy(&buf[..read]);
    let path = request.split_whitespace().nth(1).unwrap_or("/").to_string();

    let param = |key: &str| -> Option<String> {
        path.split_once('?')?
            .1
            .split('&')
            .filter_map(|pair| pair.split_once('='))
            .find(|(k, _)| *k == key)
            .map(|(_, v)| v.to_string())
    };

    let body = if path.starts_with("/fund") {
        let sats: u64 = param("sats").map_or(Ok(default_sats), |v| v.parse())?;
        let count: u32 = param("count").map_or(Ok(1), |v| v.parse())?;
        // A phrase is the useful form for a test runner: it opens the wallet
        // with the same one, and a fresh phrase per run is a wallet with no
        // leaves left over from the last.
        // A phrase is the useful form for a test runner: it opens the wallet
        // with the same one, and a fresh phrase per run is a wallet with no
        // leaves left over from the last.
        let target = match param("mnemonic") {
            Some(phrase) => spark_address_of(&percent_decode(&phrase))?,
            None => param("address").unwrap_or_else(|| default_target.to_string()),
        };
        match fund(funder, fixtures, &target, sats, count).await {
            Ok(()) => format!(r#"{{"funded":{count},"sats":{sats}}}"#),
            Err(e) => format!(r#"{{"error":"{e}"}}"#),
        }
    } else {
        r#"{"ok":true}"#.to_string()
    };

    let response = format!(
        "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}",
        body.len()
    );
    stream.write_all(response.as_bytes()).await?;
    stream.shutdown().await?;
    Ok(())
}
