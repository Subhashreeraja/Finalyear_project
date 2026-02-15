import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Step = 'form' | 'otp';

export default function AuthModal() {
  const { authModalMode, closeAuthModal, login, register, sendOtp, openAuthModal } = useAuth();
  const [step, setStep] = useState<Step>('form');

  useEffect(() => {
    if (authModalMode) setStep('form');
  }, [authModalMode]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = authModalMode === 'register';

  const handleSendOtp = async () => {
    setError('');
    const digits = mobile.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    const ok = await sendOtp(mobile);
    setLoading(false);
    if (ok) {
      setStep('otp');
    } else {
      setError('Could not send OTP. Use 123456 for demo.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (step === 'form') {
      if (isRegister && !name.trim()) {
        setError('Please enter your name.');
        return;
      }
      await handleSendOtp();
      return;
    }
    setLoading(true);
    const ok = isRegister
      ? await register(name.trim(), mobile, otp)
      : await login(mobile, otp);
    setLoading(false);
    if (ok) {
      closeAuthModal();
      setStep('form');
      setName('');
      setMobile('');
      setOtp('');
    } else {
      setError('Invalid OTP. Use 123456 for demo.');
    }
  };

  const resetAndClose = () => {
    setStep('form');
    setName('');
    setMobile('');
    setOtp('');
    setError('');
    closeAuthModal();
  };

  if (!authModalMode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={resetAndClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-accent-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {isRegister ? 'Create account' : 'Sign In'}
          </h2>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-full hover:bg-body text-accent-muted"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {step === 'form' && (
          <>
            {isRegister && (
              <label className="block mb-4">
                <span className="block text-sm font-medium text-accent-muted mb-1">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
                />
              </label>
            )}
            <label className="block mb-4">
              <span className="block text-sm font-medium text-accent-muted mb-1">Mobile number</span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={14}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
              />
            </label>
          </>
        )}

        {step === 'otp' && (
          <label className="block mb-4">
            <span className="block text-sm font-medium text-accent-muted mb-1">OTP sent to {mobile}</span>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setStep('form')}
              className="mt-2 text-sm text-accent-muted hover:text-accent-primary"
            >
              Change number
            </button>
          </label>
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-header text-white font-medium rounded-lg hover:bg-header-dark disabled:opacity-60"
          >
            {loading ? 'Please wait…' : step === 'otp' ? (isRegister ? 'Register' : 'Sign In') : 'Send OTP'}
          </button>
          {step === 'otp' && (
            <button
              onClick={resetAndClose}
              className="py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-body"
            >
              Cancel
            </button>
          )}
        </div>

        {step === 'form' && (
          <p className="mt-4 text-center text-sm text-accent-muted">
            {isRegister ? (
              <>Already have an account?{' '}
                <button type="button" onClick={() => openAuthModal('login')} className="text-header font-medium hover:underline">
                  Sign In
                </button>
              </>
            ) : (
              <>New user?{' '}
                <button type="button" onClick={() => openAuthModal('register')} className="text-header font-medium hover:underline">
                  Register
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
