# Testing the unilateral exit

A Codespace is a computer that runs in your browser. Nothing is installed on
your machine, and the test money is fake. When you are done, throw it away.

You need a GitHub account with access to this repository. Nothing else.

## 1. Start it

On this repository's GitHub page: **Code** -> **Codespaces** -> **Create
codespace on `codespaces-regtest`**.

Say **yes** when it asks to authorise access to `breez/spark-sdk`.

The first start takes about 25 minutes. A window opens with the editor on top
and a **terminal** at the bottom, where all the commands below are typed. Leave
it alone until the terminal prints a link.

## 2. Open the app

Click the link the terminal printed. That is Glow, running against a private
test chain that is yours alone.

Choose **Restore** and enter:

```
legal winner thank year wave sausage worth useful legal winner thank yellow
```

## 3. Give yourself money

In the terminal:

```
npm run regtest:fund -- 200000 3
```

600,000 sats appear in the app.

## 4. Turn on the hidden menu

In the app, open **Settings** and scroll to the bottom. **Tap the "Glow v..."
version label five times quickly.** A **Unilateral Exit** entry appears.

## 5. Run an exit

1. In the terminal, `npm run regtest:address` gives you an address to send the
   money to. Copy it.
2. In the app: **Settings** -> **Unilateral Exit**. Paste the address, choose a
   fee rate.
3. The app asks you to pay the miners and shows an address and an amount. In
   the terminal:
   `npm run regtest:send -- <that address> <that amount>`
4. Press the build button in the app.
5. In the terminal, make time pass. Nothing moves without this:
   `npm run regtest:mine -- 2016`
6. Watch the app's tracker. If it seems stuck, mine 100 more. It re-checks
   every few seconds.
7. Check the money arrived:
   `npm run regtest:balance -- <the address from step 1>`

Slightly less than 600,000 is correct. Mining fees came out on the way.

## When you are done

Go to https://github.com/codespaces and **delete** the Codespace. It costs
money while it exists. Deleting loses everything in it, which is fine: nothing
here is real.

## If something looks wrong

Type this in the terminal, and it will put everything back:

```
bash .devcontainer/start.sh
```

If that does not help, send the terminal's last 30 lines to Roei.
