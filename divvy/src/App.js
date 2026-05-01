import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Create from './CreatingNewGroup';
import img2 from './img2.png';
import img3 from './img3.png';
import img1 from './img1.jpg';
import img4 from './img4.jpg';
import img5 from './img5.jpg';
import vector1 from './dollar.svg';
import logo from './divvylogo.svg';
import { CreateGroup } from './CreatingNewGroup';
import { AuthProvider } from './context/AuthContext';
import { RegisterForm } from './components/Auth/RegisterForm';
import { LoginForm } from './components/Auth/LoginForm';
import { GoogleCallback } from './components/Auth/GoogleCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { authApi } from './api/authApi';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <RegisterForm />
            </div>
          } />
          <Route path="/login" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <LoginForm />
            </div>
          } />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/google/callback" element={<GoogleCallback />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          } />
          <Route path="/groups/:groupId" element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          } />
          <Route path="/create" element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          } />
          {/* Маршрут для верификации email */}
          <Route path="/verify-email" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="font-[Outfit] font-bold text-[#101828] text-2xl mb-3">
                  Check Your Email
                </h2>
                <p className="font-[Outfit] text-[#4a5565] text-base mb-6">
                  We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                </p>
                <p className="font-[Outfit] text-[#99a1af] text-sm">
                  Didn't receive the email? Check your spam folder or contact support.
                </p>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// BUTTON COMPONENT
const Button = ({ text, fill_background_color, text_color, border_border, border_border_radius, padding, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 hover:opacity-90 ${fill_background_color || 'bg-emerald-500'} ${text_color || 'text-white'} ${border_border || ''} ${border_border_radius || 'rounded-xl'} ${padding || 'py-4 px-8'} ${className}`}
    >
      {text}
    </button>
  );
};

// SIGN UP MODAL
const SignUpModal = ({ onClose }) => {
  const navigate = useNavigate();
  const firstFocusRef = useRef(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleRegisterClick = () => {
    onClose();
    navigate('/register');
  };

  const handleLoginClick = () => {
    onClose();
    navigate('/login');
  };

  const handleGoogleLoginClick = () => {
    window.location.href = authApi.getGoogleLoginUrl();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden">
        {/* Close button */}
        <button
          ref={firstFocusRef}
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 flex w-8 h-8 items-center justify-center rounded-full text-[#99a1af] hover:bg-gray-100 hover:text-[#101828] transition-colors text-xl leading-none z-10"
        >
          ×
        </button>

        <div className="px-8 pt-8 pb-8 flex flex-col items-center gap-0">
          {/* Logo */}
          <div className="w-10 h-10 mb-4 from-indigo-600 to-emerald-500 rounded-lg flex items-center justify-center">
            <img src={logo} alt="Divvy Logo" className="w-[20px] h-[20px]" />
          </div>

          {/* Title */}
          <h2
            id="signup-modal-title"
            className="font-[Outfit] font-bold text-[#101828] text-2xl leading-8 text-center"
          >
            Get Started with Divvy
          </h2>
          <p className="font-[Outfit] font-normal text-[#4a5565] text-sm leading-5 text-center mt-1 mb-6">
            Start splitting bills fairly with AI
          </p>

          {/* Social buttons (будут реализованы позже) */}
          <div className="flex flex-col gap-3 w-full mb-5">
            <button
              onClick={handleGoogleLoginClick}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-[Outfit] font-medium text-[#364153] text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="font-[Outfit] text-[#99a1af] text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign Up button */}
          <button
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-full font-[Outfit] font-semibold text-white text-base transition-colors mb-4"
            onClick={handleRegisterClick}
          >
            Sign Up with Email
          </button>

          {/* Log in link */}
          <p className="font-[Outfit] text-[#4a5565] text-sm text-center">
            Already have an account?{' '}
            <button
              onClick={handleLoginClick}
              className="font-[Outfit] font-bold text-[#101828] hover:text-indigo-600 transition-colors"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// HEADER COMPONENT
const Header = ({ onGetStarted }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Community', id: 'community' },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 lg:px-[106px]">
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="flex flex-row justify-between items-center py-4 lg:h-[64px]">
          {/* Logo */}
          <div className="flex items-center gap-2">
              <img src={logo} alt="Divvy Logo" className="w-[30px] h-[30px] mt-[-59px] mb-[-59px]" />
            <span className="text-2xl font-bold font-[Outfit] text-gray-900 tracking-wide">Divvy</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.id)}
                className="text-base font-[Outfit] text-gray-500 hover:text-indigo-600 transition-colors duration-200"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Button
              text="Get Started"
              fill_background_color="bg-emerald-500"
              text_color="text-white"
              border_border_radius="rounded-full"
              padding="py-3 px-6"
              className="font-[Outfit] font-medium text-sm"
              onClick={onGetStarted}
            />
          </div>

          {/* Hamburger */}
          <button className="block lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden flex flex-col gap-4 pb-4">
            {['Features', 'How It Works', 'Community'].map(item => (
              <button key={item} className="text-base font-[Outfit] text-gray-500 text-left py-2">{item}</button>
            ))}
            <Button text="Get Started" fill_background_color="bg-emerald-500" text_color="text-white" border_border_radius="rounded-full" padding="py-3 px-6" className="w-full font-[Outfit]" onClick={onGetStarted} />
          </div>
        )}
      </div>
    </header>
  );
};

// FOOTER COMPONENT
const Footer = () => {
  return (
    <footer className="w-full bg-[#0d0e10] pt-16 pb-8">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[106px]">
        <div className="flex flex-col lg:flex-row justify-between gap-10 pb-10 border-b border-gray-800">
          {/* Brand */}
          <div className="flex flex-col gap-3 max-w-[240px]">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Divvy Logo" className="w-[30px] h-[30px] mt-[-59px] mb-[-59px]" /> 
              <span className="text-2xl font-bold font-[Outfit] text-white tracking-wide">Divvy</span>
            </div>
            <p className="text-sm font-[Outfit] text-gray-500 leading-5">AI-powered bill splitting that keeps friendships intact</p>
          </div>

          {/* Links */}
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'How It Works', 'Download App'] },
            { title: 'Support', links: ['Help Center', 'Contact Us', 'FAQ', 'Privacy Policy'] },
            { title: 'Contact', links: ['hello@divvyapp.com', '@divvyapp'] },
          ].map(section => (
            <div key={section.title} className="flex flex-col gap-4">
              <h3 className="text-base font-[Helvetica] text-white">{section.title}</h3>
              <ul className="flex flex-col gap-2">
                {section.links.map(link => (
                  <li key={link}><a href="#" className="text-sm font-[Outfit] text-gray-400 hover:text-white transition-colors duration-200">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
          <p className="text-sm font-[Outfit] text-gray-500">© 2026 Divvy. All rights reserved.</p>
          <div className="flex gap-4">
            {['Terms & Conditions', 'Privacy Policy'].map(link => (
              <a key={link} href="#" className="text-sm font-[Outfit] text-gray-400 hover:text-white transition-colors duration-200">{link}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

// FEATURE ITEM
const FeatureItem = ({ text }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span className="text-base font-[Outfit] font-medium text-gray-700">{text}</span>
  </div>
);


// DEMO MODAL
const DemoModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl bg-black">
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors text-lg font-bold"
      >
        ×
      </button>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
          title="Divvy Demo"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  </div>
);

// HOMEPAGE (MAIN)
const Homepage = () => {
  const [email, setEmail] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();
  return (
    <main className="w-full bg-white overflow-x-hidden">

      {/* Sign Up Modal */}
      {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}

      <Header onGetStarted={() => setShowSignUp(true)} />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-indigo-600 via-indigo-500 to-emerald-500 px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="w-full max-w-[1440px] mx-auto">
          <div className="relative flex flex-col items-center text-center gap-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-[Outfit] font-bold text-white leading-tight max-w-3xl">
              Split Bills with AI. Keep the Friendship.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-[Outfit] text-white/80 max-w-2xl leading-relaxed">
              Divvy uses advanced Computer Vision to scan checks and automatically split bills fairly among friends and groups.
            </p>
            <p className="text-base sm:text-lg font-[Outfit] font-medium text-emerald-300">
              Divvy it up. Keep the friendship.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full max-w-sm sm:max-w-none sm:w-auto">
              <Button
                text="Scan a Check"
                fill_background_color="bg-emerald-500"
                text_color="text-white"
                border_border_radius="rounded-full"
                padding="py-4 px-8"
                className="font-[Helvetica] text-lg w-full sm:w-auto"
                onClick={() => setShowSignUp(true)}
              />
              <Button
                text="Watch Demo"
                fill_background_color="bg-white/10"
                text_color="text-white"
                border_border="border-2 border-white/50"
                border_border_radius="rounded-full"
                padding="py-4 px-8"
                className="font-[Outfit] font-medium text-lg w-full sm:w-auto"
                onClick={() => setShowDemo(true)}
              />
            </div>


            {/* Hero Image */}
            <div className="relative w-full max-w-4xl mt-8 rounded-2xl overflow-hidden shadow-2xl">
              <div className="w-full h-[300px] sm:h-[400px] bg-white/10 rounded-2xl flex items-center justify-center">
                <img src={img2} alt="Receipt scanning" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/60 to-transparent rounded-2xl flex items-end justify-center p-6">
                <p className="text-lg sm:text-xl font-[Outfit] font-medium text-white text-center">
                  AI instantly recognizes items, prices, and taxes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full bg-white py-16 px-4 sm:px-6">
        <div className="w-full max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-12 sm:gap-24 lg:gap-40">
            {[
              { value: '50K+', label: 'Happy Users' },
              { value: '500K+', label: 'Bills Split' },
              { value: '100K+', label: 'Friend Groups' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-4xl sm:text-5xl font-[Helvetica] font-normal text-indigo-600">{stat.value}</span>
                <span className="text-lg font-[Outfit] text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1440px] mx-auto flex flex-col gap-24">

          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center h-[300px] sm:h-[400px]">
              <img src={img3} alt="Scanning image" className="w-full h-full object-cover" />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-[Helvetica] font-normal text-gray-900 leading-tight">
                AI-Powered Smart Scanning
              </h2>
              <p className="text-lg font-[Outfit] text-gray-500 leading-7">
                Just snap a photo of your receipt. Our advanced Computer Vision technology instantly recognizes all items, prices, taxes, and tips with incredible accuracy.
              </p>
              <div className="flex flex-col gap-3">
                <FeatureItem text="Instant receipt recognition" />
                <FeatureItem text="Automatic item detection" />
                <FeatureItem text="Tax and tip calculation" />
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center h-[300px] sm:h-[400px]">
              <img src={img5} alt="Friends dining image" className="w-full h-full object-cover" />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-[Helvetica] font-normal text-gray-900 leading-tight">
                Fair & Effortless Bill Splitting
              </h2>
              <p className="text-lg font-[Outfit] text-gray-500 leading-7">
                No more awkward calculations or financial misunderstandings. Divvy ensures everyone pays their fair share, keeping friendships intact and stress-free.
              </p>
              <div className="flex flex-col gap-3">
                <FeatureItem text="Split by item or equal shares" />
                <FeatureItem text="Handle complex group orders" />
                <FeatureItem text="Track who owes what" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center gap-4 mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-[Helvetica] font-normal text-gray-900 text-center">
              How Divvy Works
            </h2>
            <p className="text-lg sm:text-xl font-[Outfit] text-gray-500 text-center">
              Four simple steps to stress-free bill splitting
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Scan Receipt', desc: 'Take a quick photo of your bill with your smartphone' },
              { step: '02', title: 'AI Recognizes', desc: 'Our AI instantly identifies all items, prices, and totals' },
              { step: '03', title: 'Split Fairly', desc: 'Choose how to split: by item, evenly, or custom amounts' },
              { step: '04', title: 'Pay & Done', desc: 'Everyone knows what they owe. Pay and move on!' },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-b from-indigo-600 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-[Outfit] font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-[Helvetica] font-normal text-gray-900">{item.title}</h3>
                <p className="text-base font-[Outfit] text-gray-500 leading-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community"className="w-full bg-gradient-to-b from-[#0d0e10] via-[#1f2937] to-[#0d0e10] py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1440px] mx-auto flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-[Helvetica] font-normal text-white">
            Join the Divvy Community
          </h2>
          <p className="text-lg sm:text-xl font-[Outfit] text-gray-300 max-w-xl">
            Get tips on fair bill splitting, exclusive features, and updates from the Divvy team
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mt-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 bg-white/10 border-2 border-white/20 rounded-full px-6 py-4 text-white placeholder-gray-400 font-[Outfit] text-base focus:outline-none focus:border-emerald-500 transition-colors duration-200"
            />
            <Button
              text="Subscribe"
              fill_background_color="bg-emerald-500"
              text_color="text-white"
              border_border_radius="rounded-full"
              padding="py-4 px-8"
              className="font-[Helvetica] text-base whitespace-nowrap"
              onClick={() => console.log('Subscribe:', email)}
            />
          </div>
        </div>
      </section>

      <Footer />
      {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />} {/* ← add this */}
    </main>
  );
};
export default App;
