import React, { useState } from 'react';
import img2 from './img2.png';
import img3 from './img3.png';
import img1 from './img1.jpg';
import img4 from './img4.jpg';
import img5 from './img5.jpg';
import vector1 from './dollar.svg';



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


// HEADER COMPONENT

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 lg:px-[106px]">
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="flex flex-row justify-between items-center py-4 lg:h-[64px]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-2xl font-bold font-[Outfit] text-gray-900 tracking-wide">Divvy</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {['Features', 'How It Works', 'Community'].map(item => (
              <button key={item} className="text-base font-[Outfit] text-gray-500 hover:text-indigo-600 transition-colors duration-200">
                {item}
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
            <Button text="Get Started" fill_background_color="bg-emerald-500" text_color="text-white" border_border_radius="rounded-full" padding="py-3 px-6" className="w-full font-[Outfit]" />
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
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
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


// HOMEPAGE (MAIN)

const Homepage = () => {
  const [email, setEmail] = useState('');

  return (
    <main className="w-full bg-white overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-indigo-600 via-indigo-500 to-emerald-500 px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="w-full max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center text-center gap-6">
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
              />
              <Button
                text="Watch Demo"
                fill_background_color="bg-white/10"
                text_color="text-white"
                border_border="border-2 border-white/50"
                border_border_radius="rounded-full"
                padding="py-4 px-8"
                className="font-[Outfit] font-medium text-lg w-full sm:w-auto"
              />
            </div>
            {/* Dollar Signs*/}
            <div className="absolute right-[80px] sm:right-[120px] md:right-[160px] top-[200px] sm:top-[220px] md:top-[240px] pointer-events-none w-[100px] h-[100px]">
              {/* Big - top center */}
              <img src={vector1} alt="dollar" className="absolute w-[44px] sm:w-[52px] md:w-[60px] opacity-30 top-0 left-[20px]" />
              {/* Medium - down right */}
              <img src={vector1} alt="dollar" className="absolute w-[32px] sm:w-[38px] md:w-[44px] opacity-30 top-[50px] left-[60px]" />
              {/* Small - down left */}
              <img src={vector1} alt="dollar" className="absolute w-[22px] sm:w-[26px] md:w-[32px] opacity-30 top-[55px] left-[-10px]" />
            </div>
                        
                  

            {/* Hero Image */}
            <div className="relative w-full max-w-4xl mt-8 rounded-2xl overflow-hidden shadow-2xl">
              <div className="w-full h-[300px] sm:h-[400px] bg-white/10 rounded-2xl flex items-center justify-center">
                {/* <p className="text-white/60 font-[Outfit] text-lg">[ Receipt scanning preview ]</p> */}
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
      <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1440px] mx-auto flex flex-col gap-24">

          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center h-[300px] sm:h-[400px]">
              {/* <p className="text-gray-400 font-[Outfit]">[ Scanning image ]</p> */}
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
              {/* <p className="text-gray-400 font-[Outfit]">[ Friends dining image ]</p> */}
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
      <section className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
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

      {/* Newsletter Section */}
      <section className="w-full bg-gradient-to-b from-[#0d0e10] via-[#1f2937] to-[#0d0e10] py-20 px-4 sm:px-6 lg:px-8">
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
    </main>
  );
};

export default Homepage;
