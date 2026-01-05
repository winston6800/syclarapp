import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, Shield, Target, TrendingUp, CheckCircle, 
  ArrowRight, Flame, Star, Users, Brain
} from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-black to-black" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>
        
        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic">SYCLAR</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-white/70 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="px-5 py-2.5 bg-gold text-black text-sm font-bold rounded-full hover:bg-gold-light transition"
            >
              Start Free Trial
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-8">
            <Flame className="w-4 h-4 text-gold" />
            <span className="text-xs font-bold text-gold uppercase tracking-wider">3-Day Free Trial</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            <span className="text-white">Overcome</span>
            <br />
            <span className="text-gold italic">Social Anxiety</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            The premium coaching system designed to build real-world confidence through 
            daily action, accountability tracking, and AI-powered verification.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup" 
              className="group px-8 py-4 bg-gold text-black font-bold rounded-2xl hover:bg-gold-light transition-all flex items-center space-x-2"
            >
              <span>Start Your Transformation</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="text-sm text-white/40">
              <span className="text-gold font-bold">$29</span>/month after trial
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-black to-dark">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Your <span className="text-gold italic">Daily Protocol</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              A systematic approach to building unshakeable confidence through consistent action.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target className="w-8 h-8" />}
              title="Track Progress"
              description="Log daily interactions and watch your confidence grow with detailed analytics and streak tracking."
            />
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="AI Verification"
              description="Upload screenshots to verify real-world interactions. Our AI confirms authentic social engagement."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Build Momentum"
              description="Maintain streaks, unlock achievements, and see your progress visualized over weeks and months."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-dark">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-br from-dark-accent to-black border border-gold/20 rounded-3xl p-12 text-center">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-gold fill-gold" />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl text-white/90 font-medium mb-6 max-w-3xl mx-auto leading-relaxed">
              "Action is the only antidote to anxiety. Syclar keeps me accountable 
              and has transformed my approach to social situations."
            </blockquote>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Trusted by 1,000+ users</p>
                <p className="text-sm text-white/50">Building confidence daily</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-black" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Simple, <span className="text-gold italic">Transparent</span> Pricing
            </h2>
            <p className="text-white/50">
              Start with a 3-day free trial. Cancel anytime.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative bg-gradient-to-br from-dark-accent to-black border-2 border-gold rounded-3xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-gold text-black text-xs font-bold uppercase">
                Most Popular
              </div>
              
              <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-2">Premium Coach</h3>
                <p className="text-white/50 text-sm">Full access to everything</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-black text-gold">$29</span>
                  <span className="text-white/50 ml-2">/month</span>
                </div>
                <p className="text-gold/60 text-sm mt-2">3-day free trial included</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited interaction logging',
                  'AI-powered verification',
                  'Progress analytics & streaks',
                  'Achievement system',
                  'Cross-device sync',
                  'Priority support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className="block w-full py-4 bg-gold text-black text-center font-bold rounded-xl hover:bg-gold-light transition"
              >
                Start Free Trial
              </Link>
              
              <p className="text-center text-white/30 text-xs mt-4">
                No credit card required for trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-gold/10 to-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Ready to <span className="text-gold italic">Transform?</span>
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands who have taken control of their social confidence. 
            Your 3-day free trial starts now.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center space-x-2 px-10 py-5 bg-gold text-black font-bold text-lg rounded-2xl hover:bg-gold-light transition-all"
          >
            <span>Begin Your Journey</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <span className="text-lg font-black tracking-tighter italic">SYCLAR</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-white/50">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Support</a>
            </div>
          </div>
          <p className="text-center text-white/30 text-sm mt-8">
            © {new Date().getFullYear()} Syclar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="p-8 bg-gradient-to-br from-dark-accent to-black border border-white/10 rounded-2xl hover:border-gold/30 transition-all group">
    <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 group-hover:bg-gold/20 transition">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-white/50 leading-relaxed">{description}</p>
  </div>
);

export default Landing;


