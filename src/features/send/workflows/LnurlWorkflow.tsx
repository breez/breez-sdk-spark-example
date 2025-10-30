import React, { useEffect, useMemo, useState } from 'react';
import type { LnurlPayRequestDetails, PrepareLnurlPayRequest, PrepareLnurlPayResponse } from '@breeztech/breez-sdk-spark';
import type { PaymentStep } from '../../../types/domain';
import { FormGroup, FormError, PrimaryButton, FormDescription } from '../../../components/ui';
import ConfirmStep from '../steps/ConfirmStep';

interface LnurlWorkflowProps {
  parsed: LnurlPayRequestDetails;
  onBack: () => void;
  onRun: (runner: () => Promise<void>) => Promise<void>;
  onPrepare: (args: PrepareLnurlPayRequest) => Promise<PrepareLnurlPayResponse>;
  onPay: (prepareResponse: PrepareLnurlPayResponse) => Promise<void>;
}

const LnurlWorkflow: React.FC<LnurlWorkflowProps> = ({ parsed, onBack, onRun, onPrepare, onPay }) => {

  const [step, setStep] = useState<PaymentStep>('amount');
  const [amount, setAmount] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prepareResponse, setPrepareResponse] = useState<PrepareLnurlPayResponse | null>(null);

  // derive constraints
  const minSats = useMemo(() => {
    const msat = parsed.minSendable ?? 0;
    return Math.ceil(msat / 1000);
  }, [parsed]);
  const maxSats = useMemo(() => {
    const msat = parsed.maxSendable ?? 0;
    return Math.max(1, Math.floor(msat / 1000));
  }, [parsed]);
  const commentMaxLen = parsed.commentAllowed ?? 0;
  const commentAllowed = commentMaxLen > 0;
  const destription = useMemo(() => {
    let metadataArr = JSON.parse(parsed.metadataStr);
    for (let i = 0; i < metadataArr.length; i++) {
      if (metadataArr[i][0] === "text/plain") {
        return metadataArr[i][1];
      }
    }
    return parsed.url;
  }, [parsed]);

  useEffect(() => {
    setError(null);
  }, [step]);

  const onAmountNext = async () => {
    const sats = parseInt(amount, 10);
    if (!sats || sats <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (minSats && sats < minSats) {
      setError(`Amount must be at least ${minSats} sats`);
      return;
    }
    if (maxSats && sats > maxSats) {
      setError(`Amount must be at most ${maxSats} sats`);
      return;
    }
    if (commentAllowed && commentMaxLen && comment.length > commentMaxLen) {
      setError(`Comment must be at most ${commentMaxLen} characters`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const resp = await onPrepare({ amountSats: sats, comment: comment ? comment : undefined, payRequest: parsed });
      setPrepareResponse(resp);
      setStep('confirm');
    } catch (err) {
      console.error('Failed to prepare LNURL Pay:', err);
      setError(`Failed to prepare LNURL Pay: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!prepareResponse) return;
    await onRun(() => onPay(prepareResponse));
  };

  // Compute fees (best effort until exact shape is verified)
  const feesSat: number | null = useMemo(() => {
    // If the response exposes a fee field in the SDK types, wire it later; for now keep null to avoid assumptions
    return prepareResponse?.feeSats ?? null;
  }, [prepareResponse]);

  if (step === 'confirm' && prepareResponse) {
    return (
      <ConfirmStep amountSats={BigInt(parseInt(amount, 10))} feesSat={feesSat} error={error} isLoading={isLoading} onConfirm={onConfirm} />
    );
  }

  // amount + optional comment form
  return (
    <FormGroup>
      <div className="text-center mb-6">
        <FormDescription>{destription}</FormDescription>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-[rgb(var(--text-white))]">Amount (sats)</label>
          <div className="text-xs opacity-70">
            Min {minSats.toLocaleString()} / Max {maxSats.toLocaleString()}
          </div>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Between ${minSats} and ${maxSats} sats`}
          className="w-full p-3 border border-[rgb(var(--card-border))] rounded-lg bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] placeholder-[rgb(var(--text-white))] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-blue))]"
          disabled={isLoading}
          min={minSats}
          max={maxSats}
        />
      </div>

      {/* Optional comment */}
      {commentAllowed && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-[rgb(var(--text-white))]">Comment</label>
            {commentMaxLen && (
              <div className="text-xs opacity-70">{comment.length}/{commentMaxLen}</div>
            )}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={commentMaxLen ? `Max ${commentMaxLen} characters` : 'Optional comment'}
            className="w-full p-3 border border-[rgb(var(--card-border))] rounded-lg bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] placeholder-[rgb(var(--text-white))] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-blue))] resize-none"
            rows={3}
            maxLength={commentMaxLen}
            disabled={isLoading}
          />
        </div>
      )}

      <FormError error={error} />

      <div className="flex gap-3 mt-6">
        <PrimaryButton onClick={onBack} disabled={isLoading} className="flex-1 bg-gray-600 hover:bg-gray-700">
          Back
        </PrimaryButton>
        <PrimaryButton onClick={onAmountNext} disabled={isLoading || !amount} className="flex-1">
          Continue
        </PrimaryButton>
      </div>
    </FormGroup>
  );
};

export default LnurlWorkflow;
