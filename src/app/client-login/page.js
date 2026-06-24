'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username || !password) {
      setError('Please enter both your username and password.');
      setIsLoading(false);
      return;
    }

    // Simulate secure network verification
    await new Promise(resolve => setTimeout(resolve, 1400));

    // Save auth state and route to dashboard
    sessionStorage.setItem('client_authenticated', 'true');
    sessionStorage.setItem('current_user', username);
    window.location.href = '/client';
  };

  const styles = `
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: white; margin: 0; padding: 0; color: #1f2937; -webkit-font-smoothing: antialiased; }
    
    /* Top Utility Navigation */
    .login-top-nav { background-color: #0c2074; color: white; display: flex; justify-content: space-between; align-items: center; padding: 12px 40px; }
    .brand-logo { font-size: 24px; font-weight: 800; letter-spacing: -1px; display: flex; align-items: center; gap: 4px; }
    .brand-logo span { color: white; }
    .brand-logo .accent { color: #e31837; }
    .nav-links { display: flex; gap: 24px; font-size: 14px; font-weight: 500; }
    .nav-links a { color: white; text-decoration: none; cursor: pointer; transition: opacity 0.2s; }
    .nav-links a:hover { opacity: 0.8; text-decoration: underline; }

    /* Main Container */
    .login-container { max-width: 1000px; margin: 40px auto; padding: 0 20px; }

    /* FDIC Banner */
    .fdic-banner { border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px; display: flex; align-items: center; gap: 12px; margin-bottom: 40px; font-size: 14px; color: #1f2937; }
    .fdic-bold { font-weight: 800; font-size: 16px; color: #0c2074; letter-spacing: -0.5px; }
    .fdic-italic { font-style: italic; color: #4b5563; }

    /* Grid Layout */
    .login-grid { display: grid; grid-template-columns: 5fr 4fr; gap: 80px; align-items: start; }

    /* Left Column: Form */
    h1 { font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 32px 0; }
    
    .input-group { margin-bottom: 32px; position: relative; }
    .floating-label { display: block; font-size: 16px; color: #4b5563; margin-bottom: 4px; }
    .clean-input { width: 100%; border: none; border-bottom: 1px solid #9ca3af; padding: 8px 0; font-size: 16px; color: #1f2937; outline: none; transition: border-color 0.2s; background: transparent; }
    .clean-input:focus { border-bottom: 2px solid #1d4ed8; padding-bottom: 7px; }
    
    .show-toggle { position: absolute; right: 0; bottom: 8px; background: none; border: none; color: #4b5563; font-size: 14px; font-weight: 500; cursor: pointer; padding: 0; }
    .show-toggle:hover { color: #1d4ed8; text-decoration: underline; }

    .checkbox-row { display: flex; align-items: center; gap: 12px; margin-top: -16px; margin-bottom: 32px; }
    .checkbox-row input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; border: 1px solid #9ca3af; border-radius: 4px; }
    .checkbox-row label { font-size: 16px; color: #4b5563; cursor: pointer; }

    .error-msg { background: #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; font-size: 14px; font-weight: 500; border-left: 4px solid #ef4444; }

    .btn-solid { width: 100%; background-color: #2563eb; color: white; border: none; padding: 14px; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
    .btn-solid:hover { background-color: #1d4ed8; }
    .btn-solid:disabled { background-color: #9ca3af; cursor: not-allowed; }

    .divider { display: flex; align-items: center; text-align: center; margin: 24px 0; color: #6b7280; font-size: 14px; font-weight: 600; }
    .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #d1d5db; }
    .divider::before { margin-right: 16px; }
    .divider::after { margin-left: 16px; }

    .btn-outline { width: 100%; background-color: transparent; color: #2563eb; border: 1px solid #2563eb; padding: 14px; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; display: flex; justify-content: center; align-items: center; gap: 10px; }
    .btn-outline:hover { background-color: #eff6ff; }
    
    .forgot-link { display: inline-block; margin-top: 32px; color: #2563eb; font-size: 16px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px; }
    .forgot-link:hover { text-decoration: underline; }

    /* Right Column: Passkey Promo */
    .passkey-card { background-color: #f8fafc; border-radius: 12px; padding: 40px; }
    .passkey-title { font-size: 22px; font-weight: 700; color: #1f2937; margin: 24px 0 16px 0; letter-spacing: -0.5px; }
    .passkey-desc { font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
    .learn-more { color: #2563eb; font-weight: 600; font-size: 16px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; }
    .learn-more:hover { text-decoration: underline; }

    /* Loading Spinner */
    .spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* Responsive */
    @media (max-width: 900px) {
      .login-grid { grid-template-columns: 1fr; gap: 48px; }
      .login-top-nav { padding: 16px 20px; flex-direction: column; gap: 16px; align-items: flex-start; }
      .nav-links { flex-wrap: wrap; gap: 16px; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Top Header */}
      <header className="login-top-nav">
        <div className="brand-logo">
          Global <span className="accent">Vault</span>
        </div>
        <div className="nav-links">
          <a>Global Vault en Español</a>
          <a>Customer Service</a>
          <a>Locations</a>
        </div>
      </header>

      <main className="login-container">
        {/* FDIC Banner */}
        <div className="fdic-banner">
          <span className="fdic-bold">FDIC</span>
          <span className="fdic-italic">FDIC-Insured - Backed by the full faith and credit of the U.S. Government</span>
        </div>

        <div className="login-grid">
          
          {/* Left Side: Form */}
          <div>
            <h1>Account login</h1>
            
            {error && <div className="error-msg">{error}</div>}
            
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="floating-label">Username</label>
                <input 
                  type="text" 
                  className="clean-input" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  disabled={isLoading}
                />
              </div>

              <div className="checkbox-row">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember my username</label>
              </div>

              <div className="input-group">
                <label className="floating-label">Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="clean-input" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading} 
                />
                <button 
                  type="button" 
                  className="show-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <button type="submit" className="btn-solid" disabled={isLoading}>
                {isLoading ? <><div className="spinner"></div> Authenticating...</> : 'Log in with password'}
              </button>

              <div className="divider">OR</div>

              <button type="button" className="btn-outline" disabled={isLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Use passkey
              </button>

              <a href="#" className="forgot-link">Forgot username or password <span>›</span></a>
            </form>
          </div>

          {/* Right Side: Passkey Advertisement */}
          <div>
            <div className="passkey-card">
              {/* Custom SVG replicating the exact blue avatar/key icon */}
              <svg width="80" height="80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="22" r="10" fill="#2563eb"/>
                <path d="M8 50C8 40 16 36 28 36C40 36 46 38.5 49 43.5V50H8Z" fill="#2563eb"/>
                <circle cx="50" cy="26" r="6" fill="#2563eb"/>
                <path d="M48 31V44H52V40H56V36H52V31Z" fill="#2563eb"/>
              </svg>

              <h2 className="passkey-title">Don't have a passkey yet?</h2>
              <p className="passkey-desc">
                Add a passkey to log in using your face, fingerprint or the code you use to unlock your device. It's faster and more secure than a password.
              </p>
              <a href="#" className="learn-more">Learn more <span>›</span></a>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}