import { Link } from 'react-router-dom';
import referenceImage from '../assets/okada-login-reference.png';

function ScooterScene() {
  return (
    <div className="auth-scene" aria-label="A scooter riding through the city">
      <div className="auth-scene-sun" />
      <div className="auth-cloud auth-cloud-one" />
      <div className="auth-cloud auth-cloud-two" />
      <svg className="auth-skyline" viewBox="0 0 760 240" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 127h34V87h15v40h22V62h19v65h17V99h16v28h22V45h23v82h18V82h16v45h25V70h28v57h16V31h24v96h18v-47h15v47h19V87h30v40h17V52h22v75h24V72h18v55h19V36h27v91h20v-50h21v50h24V78h18v49h25V48h24v79h30V81h21v46h29v-43h24v43h18V66h25v61h25v-31h22v31h29v113H0z" fill="#83d1e8" opacity=".38" />
        <path d="M0 161h25v-31h25v31h12v-51h29v51h17v-27h25v27h18v-71h35v71h14v-41h23v41h24v-62h31v62h13V98h29v63h15v-34h26v34h19v-73h36v73h20v-51h24v51h20v-31h31v31h17v-64h37v64h17v-43h27v43h20v-56h31v56h22v-36h27v36h20v-67h38v67h18v-40h29v40h24v79H0z" fill="#43add0" opacity=".68" />
        <path d="M0 189h17v-50h32v50h13v-29h28v29h16v-63h37v63h17v-40h26v40h16v-79h35v79h18v-53h25v53h17v-33h35v33h17v-65h39v65h20v-47h26v47h15v-78h35v78h17v-42h27v42h21v-61h36v61h17v-35h29v35h22v-70h37v70h20v-48h32v48h17v-60h37v60h18v-43h31v43h25v52H0z" fill="#1389b4" opacity=".85" />
        <path d="M0 217h760" stroke="#e8ffff" strokeWidth="3" opacity=".75" />
        <path d="M140 0h12v161h-12zM135 158h22v8h-22zM141 166h10v21h-10z" fill="#148ab5" opacity=".7" />
      </svg>
      <div className="auth-scene-copy">
        <span className="auth-scene-eyebrow">THE CITY IS YOURS</span>
        <h1>Ride smarter.<br />Get there faster.</h1>
        <p>Good rides. Great people. Every day.</p>
      </div>
      <div className="auth-road"><span /><span /><span /></div>
      <div className="auth-scooter" aria-hidden="true">
        <svg viewBox="0 0 330 164" role="img">
          <ellipse cx="159" cy="147" rx="131" ry="8" fill="#123347" opacity=".18" />
          <g className="auth-wheel"><circle cx="73" cy="125" r="29" fill="#122b3a"/><circle cx="73" cy="125" r="19" fill="#e9f4f5"/><circle cx="73" cy="125" r="8" fill="#7793a1"/><path d="M73 107v36m-18-18h36m-31-13 26 26m0-26-26 26" stroke="#829eaa" strokeWidth="2"/></g>
          <g className="auth-wheel"><circle cx="252" cy="125" r="29" fill="#122b3a"/><circle cx="252" cy="125" r="19" fill="#e9f4f5"/><circle cx="252" cy="125" r="8" fill="#7793a1"/><path d="M252 107v36m-18-18h36m-31-13 26 26m0-26-26 26" stroke="#829eaa" strokeWidth="2"/></g>
          <path d="M54 105q2-13 18-17l49-1 31 13 53-3 24-19 21 7 15 14-14 13-39 6-32-7-47 7-62-2z" fill="#ed1c2e" stroke="#b71020" strokeWidth="4" strokeLinejoin="round"/>
          <path d="m127 91 31-18 47 3-21 24-40 5z" fill="#ff3845"/><path d="M106 85h51l24 11h-44z" fill="#182c3c"/><path d="m64 100 12-9 17 4-12 8z" fill="#fff2b0"/><path d="M191 103h32l16 8h-46z" fill="#182c3c"/><path d="M81 91 97 68l22-13 24 6 18 17-16 7-17-7-19 22" fill="#ffb43e"/><path d="m119 57 6-17 19-10 18 8-6 24-19 11z" fill="#ed1c2e" stroke="#b71020" strokeWidth="3"/><path d="m129 47 8-9 14 2-3 10z" fill="#aee9f5"/><path d="m144 75 25 22 21 1 14 10-17 6-30-8-27-21z" fill="#ffb43e"/><path d="m84 86 13 11-15 9-10-8z" fill="#f4c49c"/><path d="m151 101 10 17 35 9-5 7-43-5-14-21" fill="#182c3c"/><path d="m188 123 22 3 11 10-9 4-24-7z" fill="#9d6948"/><path d="M130 73q-8 6-13 17m47-15q19 9 25 22" fill="none" stroke="#dc8f28" strokeWidth="3"/>
          <path d="m246 77 14-24 14-2-5 30m-14-18 17-8 6 3" fill="none" stroke="#1c3443" strokeWidth="5" strokeLinecap="round"/>
          <circle cx="264" cy="50" r="5" fill="#dceef2"/>
        </svg>
      </div>
      <div className="auth-benefits">
        <div><span className="auth-benefit-icon">⌖</span><span><strong>Find a ride</strong><small>Right around you</small></span></div>
        <div><span className="auth-benefit-icon">✓</span><span><strong>Ride with care</strong><small>Safe and reliable</small></span></div>
        <div><span className="auth-benefit-icon">↗</span><span><strong>Save your time</strong><small>On every trip</small></span></div>
      </div>
    </div>
  );
}

function Brand() {
  return <Link to="/" className="auth-brand" aria-label="Okada Connect home"><span className="auth-brand-mark">O<span>•</span></span><span className="auth-brand-words"><strong>OKADA</strong><b>CONNECT</b></span></Link>;
}

export function RoleSwitch({ role, onChange }) {
  return <div className="auth-role-switch" aria-label="Choose account type">
    <button type="button" onClick={() => onChange('rider')} className={role === 'rider' ? 'active' : ''} aria-pressed={role === 'rider'}><span aria-hidden="true">♙</span> Rider</button>
    <button type="button" onClick={() => onChange('customer')} className={role === 'customer' ? 'active' : ''} aria-pressed={role === 'customer'}><span aria-hidden="true">♧</span> Customer</button>
  </div>;
}

export default function AuthLayout({ children }) {
  return <main className="auth-page" style={{ '--auth-reference-image': `url("${referenceImage}")` }}><section className="auth-art-panel" aria-hidden="true"><span className="auth-wheel-motion auth-wheel-front" /><span className="auth-wheel-motion auth-wheel-back" /></section><section className="auth-form-panel">{children}<footer className="auth-page-footer">© 2025 Okada Connect <span>Made for the road ahead.</span></footer></section></main>;
}
