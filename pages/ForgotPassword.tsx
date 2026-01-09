import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);
    
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-black to-black" />
        
        <div className="relative w-full max-w-md">
          <div className="bg-dark-accent/50 backdrop-blur-xl border border-gold/20 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-gold" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">Check Your Email</h1>
            <p className="text-white/60 mb-6">
              We've sent a password reset link to <span className="text-gold">{email}</span>
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-gold text-black font-bold rounded-xl hover:bg-gold-light transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-black to-black" />
      
      <div className="relative w-full max-w-md">
        <Link 
          to="/login" 
          className="inline-flex items-center space-x-2 text-white/50 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to login</span>
        </Link>

        <div className="bg-dark-accent/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-14 h-14 bg-gold rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-black" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-center text-white mb-2">Reset Password</h1>
          <p className="text-white/50 text-center text-sm mb-8">
            Enter your email to receive a reset link
          </p>

          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold focus:outline-none transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gold text-black font-bold rounded-xl hover:bg-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;




