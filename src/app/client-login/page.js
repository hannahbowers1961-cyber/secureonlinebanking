'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientLogin() {
  const [mode, setMode] = useState('login_step_1'); 
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [usersDb, setUsersDb] = useState([]);
  const [onlineId, setOnlineId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [regId, setRegId] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  useEffect(() => {
    const existingDb = localStorage.getItem('apex_users_db');
    if (existingDb) {
      setUsersDb(JSON.parse(existingDb));
    } else {
      const defaultUsers = [{ onlineId: 'ApexAdmin', password: 'Vault2026', role: 'admin' }];
      localStorage.setItem('apex_users_db', JSON.stringify(defaultUsers));
      setUsersDb(defaultUsers);
    }
  }, []);

  const handleIdSubmit = (e) => {
    e.preventDefault();
    if (!onlineId) return;
    setError(''); setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      const userExists = usersDb.find(u => u.onlineId.toLowerCase() === onlineId.toLowerCase());
      if (userExists) setMode('login_step_2');
      else setError('We could not find an account with that Online ID. Please try again or register.');
    }, 1000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!password) return;
    setError(''); setIsAuthenticating(true);
    setTimeout(() => {
      const user = usersDb.find(u => u.onlineId.toLowerCase() === onlineId.toLowerCase());
      if (user && user.password === password) {
        sessionStorage.setItem('client_authenticated', 'true');
        sessionStorage.setItem('current_user', user.onlineId);
        router.push('/client');
      } else {
        setError('Logon information is incorrect. Please try again.');
        setIsAuthenticating(false); setPassword('');
      }
    }, 1500);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regId || !regPass || !regConfirm) return;
    if (regPass !== regConfirm) return setError('Passwords do not match.');
    if (usersDb.some(u => u.onlineId.toLowerCase() === regId.toLowerCase())) return setError('That Online ID is already taken.');
    
    setError(''); setIsAuthenticating(true);
    setTimeout(() => {
      const newUser = { onlineId: regId, password: regPass, role: 'client' };
      const updatedDb = [...usersDb, newUser];
      setUsersDb(updatedDb);
      localStorage.setItem('apex_users_db', JSON.stringify(updatedDb));
      sessionStorage.setItem('client_authenticated', 'true');
      sessionStorage.setItem('current_user', newUser.onlineId);
      router.push('/client');
    }, 1500);
  };

  // Raw CSS injection for absolute responsiveness
  const styles = `
    .page-wrapper { min-height: 100vh; background-color: #112e45; color: white; font-family: sans-serif; display: flex; flex-direction: column; }
    .app-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background-color: #0d2336; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .header-links { display: flex; align-items: center; gap: 24px; font-size: 14px; font-weight: bold; }
    .main-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 24px; }
    .layout-grid { display: flex; width: 100%; max-width: 1000px; gap: 64px; justify-content: center; align-items: center; }
    .left-col { flex: 1; min-width: 300px; }
    .right-col { width: 100%; max-width: 380px; background-color: white; color: #111; padding: 32px; border-radius: 2px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; }
    .input-box { width: 100%; border: none; outline: none; font-size: 18px; background-color: transparent; }
    .btn-primary { width: 100%; background-color: #53682b; color: white; padding: 14px; font-size: 18px; font-weight: bold; border: none; cursor: pointer; border-radius: 2px; }
    
    /* MOBILE RESPONSIVENESS */
    @media (max-width: 768px) {
      .app-header { padding: 12px 16px; }
      .hide-mobile { display: none !important; }
      .main-content { padding: 24px 16px; align-items: flex-start; }
      .layout-grid { flex-direction: column; gap: 32px; align-items: center; }
      .left-col { min-width: 100%; text-align: center; }
      .right-col { max-width: 100%; padding: 24px; width: 100%; }
      h1 { font-size: 28px !important; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="page-wrapper">
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg style={{ width: '24px', height: '24px', color: 'white' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
          </div>
          <div className="header-links">
            <span className="hide-mobile" onClick={() => { setMode('register'); setError(''); }} style={{ cursor: 'pointer', color: mode === 'register' ? '#93c5fd' : 'white' }}>JOIN APEX GLOBAL VAULT</span>
            <span className="hide-mobile" onClick={() => { setMode('register'); setError(''); }} style={{ cursor: 'pointer' }}>REGISTER FOR ACCESS</span>
            <div className="hide-mobile" style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
            <Link href="/" style={{ fontSize: '24px', fontWeight: '300', color: 'white', textDecoration: 'none' }}>✕</Link>
          </div>
        </header>

        <main className="main-content">
          <div className="layout-grid">
            <div className="left-col">
              <h1 style={{ fontSize: '36px', fontWeight: 'normal', fontFamily: 'serif', marginBottom: '16px', marginTop: '0' }}>
                {mode === 'register' ? 'Join Apex Global Vault Today' : 'New to Apex Global Vault?'}
              </h1>
              <p style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '32px', lineHeight: '1.6' }}>
                {mode === 'register' ? "Create your unique Online ID and secure password to gain access to your private wealth portal." : "Become a member by selecting \"Join Apex Global Vault\" — it's easy and only takes a few minutes."}
              </p>
              {mode !== 'register' && (
                <button onClick={() => { setMode('register'); setError(''); }} style={{ backgroundColor: 'white', color: '#112e45', fontWeight: 'bold', padding: '14px 32px', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '16px' }}>
                  Join Apex Global Vault
                </button>
              )}
            </div>

            <div className="right-col">
              {isAuthenticating && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <div style={{ fontWeight: 'bold', color: '#53682b', letterSpacing: '2px' }}>{mode === 'register' ? 'CREATING IDENTITY...' : 'AUTHENTICATING...'}</div>
                </div>
              )}

              <h2 style={{ fontSize: '28px', fontFamily: 'serif', textAlign: 'center', margin: '0 0 24px 0', color: '#333' }}>
                {mode === 'register' ? 'Register Access' : 'Log On'}
              </h2>

              {error && <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '14px', marginBottom: '24px' }}>{error}</div>}

              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit}>
                  <div style={{ border: '1px solid #94a3b8', padding: '8px 12px', marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Choose a Unique Online ID</label>
                    <input type="text" required value={regId} onChange={(e) => setRegId(e.target.value)} className="input-box" style={{ color: '#005ea6' }} />
                  </div>
                  <div style={{ border: '1px solid #94a3b8', padding: '8px 12px', marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Create Secure Password</label>
                    <input type="password" required value={regPass} onChange={(e) => setRegPass(e.target.value)} className="input-box" style={{ color: '#0f172a' }} />
                  </div>
                  <div style={{ border: '1px solid #94a3b8', padding: '8px 12px', marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Confirm Password</label>
                    <input type="password" required value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} className="input-box" style={{ color: '#0f172a' }} />
                  </div>
                  <button type="submit" className="btn-primary">Establish Identity</button>
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button type="button" onClick={() => { setMode('login_step_1'); setError(''); }} style={{ background: 'none', border: 'none', color: '#005ea6', fontSize: '14px', textDecoration: 'underline', cursor: 'pointer' }}>Already have an ID? Log On</button>
                  </div>
                </form>
              )}

              {mode === 'login_step_1' && (
                <form onSubmit={handleIdSubmit}>
                  <div style={{ border: '1px solid #94a3b8', padding: '8px 12px', marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Online ID</label>
                    <input type="text" required value={onlineId} onChange={(e) => setOnlineId(e.target.value)} className="input-box" style={{ color: '#005ea6' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '24px' }}>
                    <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ marginTop: '4px' }} />
                    <label htmlFor="remember" style={{ fontSize: '14px', color: '#475569', lineHeight: '1.4', cursor: 'pointer' }}>Remember this browser to log<br/>on faster next time.</label>
                  </div>
                  <button type="submit" className="btn-primary">Next</button>
                  <div style={{ marginTop: '24px', textAlign: 'center' }}><Link href="/" style={{ color: '#005ea6', fontSize: '14px', textDecoration: 'none' }}>I need help logging on</Link></div>
                </form>
              )}

              {mode === 'login_step_2' && (
                <form onSubmit={handlePasswordSubmit}>
                  <div style={{ border: '1px solid #94a3b8', borderBottom: 'none', padding: '8px 12px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Online ID</label>
                      <div style={{ fontSize: '18px', color: '#0f172a' }}>{onlineId}</div>
                    </div>
                    <button type="button" onClick={() => setMode('login_step_1')} style={{ background: 'none', border: 'none', color: '#005ea6', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                  </div>
                  <div style={{ border: '1px solid #94a3b8', padding: '8px 12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Password</label>
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-box" style={{ color: '#0f172a' }} />
                    </div>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', borderLeft: '1px solid #cbd5e1', paddingLeft: '16px', marginLeft: '8px', color: '#005ea6', fontSize: '14px', cursor: 'pointer' }}>{showPassword ? "Hide" : "Show"}</button>
                  </div>
                  <button type="submit" className="btn-primary">Log On</button>
                  <div style={{ marginTop: '24px', textAlign: 'center' }}><Link href="/" style={{ color: '#005ea6', fontSize: '14px', textDecoration: 'none' }}>I need help logging on</Link></div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}