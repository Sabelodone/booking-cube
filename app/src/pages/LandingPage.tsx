import { Link } from 'react-router-dom';
import { 
  Clock, Users, CheckCircle, Calendar, 
  DollarSign, Award, Target, BarChart, Star, Shield,
  ArrowRight, Sparkles, GraduationCap, Brain, Zap, TrendingUp, BookOpen
} from 'lucide-react';
import Logo from '../components/Logo'; // Import the Logo component

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Navigation - Modern Design */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl z-50 border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link to="/" className="flex items-center space-x-2 group">
              <Logo size="navigation" link={false} />
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                to="/login"
                className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105 hidden md:block text-lg"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="relative group bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3.5 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 overflow-hidden text-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center space-x-2">
                  <span>Start Learning</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern Design */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="animate-fade-in">
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Master <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Maths</span> &{' '}
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">Science</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your academic performance with our intelligent tutoring system. 
                Get personalized learning paths, expert guidance, and proven results.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="group relative bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center space-x-2">
                    <GraduationCap className="h-5 w-5" />
                    <span>Start Free Trial</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-blue-300"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>See How It Works</span>
                  </span>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                {[
                  { value: '98%', label: 'Pass Rate', color: 'text-green-500' },
                  { value: '2.1x', label: 'Grade Boost', color: 'text-blue-500' },
                  { value: '60+', label: 'Students', color: 'text-purple-500' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-2xl border border-gray-100">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl rotate-12 opacity-20 blur-xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-8">
                    <Logo size="hero" link={false} />
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Live Session Dashboard</h3>
                      <p className="text-gray-500 text-lg">Interactive learning experience</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { time: 'Today, 3:00 PM', subject: 'Advanced Calculus', status: 'upcoming', color: 'bg-blue-500' },
                      { time: 'Tomorrow, 10:00 AM', subject: 'Organic Chemistry', status: 'scheduled', color: 'bg-purple-500' },
                      { time: 'Sunday, 2:00 PM', subject: 'Physics Workshop', status: 'group', color: 'bg-green-500' }
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${session.color}`}></div>
                          <div>
                            <div className="font-medium text-gray-900">{session.subject}</div>
                            <div className="text-sm text-gray-500">{session.time}</div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                          {session.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full mb-4">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">WHY CHOOSE US?</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Intelligent <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning</span> Experience
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with expert teaching methodologies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Personalized Growth",
                description: "Custom learning paths based on your progress and goals",
                color: "purple",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Users,
                title: "Collaborative Learning",
                description: "Interactive group sessions with peer-to-peer learning",
                color: "green",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Shield,
                title: "Expert Verified",
                description: "All tutors are certified educators with proven track records",
                color: "orange",
                gradient: "from-orange-500 to-amber-500"
              },
              {
                icon: Brain,
                title: "AI-Powered Analytics",
                description: "Smart analysis of learning patterns and weak areas",
                color: "blue",
                gradient: "from-blue-500 to-cyan-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl" 
                     style={{background: `linear-gradient(135deg, ${feature.color} 0%, transparent 100%)`}}>
                </div>
                <div className={`bg-gradient-to-r ${feature.gradient} p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Modern */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full mb-4">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">FLEXIBLE PLANS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning</span> Path
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Group Plan */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Users className="h-8 w-8 text-blue-500" />
                        <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          GROUP LEARNING
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Collective Mastery</h3>
                      <p className="text-gray-600">Learn together, grow together</p>
                    </div>
                    <div className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      MOST POPULAR
                    </div>
                  </div>
                  
                  <div className="flex items-baseline mb-8">
                    <span className="text-5xl font-bold text-gray-900">R500</span>
                    <span className="text-gray-600 ml-2 text-lg">/session</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {[
                      { text: "Interactive group sessions", icon: Users },
                      { text: "Max 10 students per class", icon: BookOpen },
                      { text: "Weekly progress reports", icon: BarChart },
                      { text: "Access to all materials", icon: Shield },
                      { text: "Sunday intensive workshops", icon: Calendar }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center">
                        <item.icon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    to="/signup"
                    className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Join Group Plan
                  </Link>
                </div>
              </div>
            </div>

            {/* 1-on-1 Plan */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Target className="h-8 w-8 text-purple-500" />
                        <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          PERSONALIZED
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Private Excellence</h3>
                      <p className="text-gray-600">Your journey, your pace</p>
                    </div>
                    <div className="px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      PREMIUM
                    </div>
                  </div>
                  
                  <div className="flex items-baseline mb-8">
                    <span className="text-5xl font-bold text-gray-900">R200</span>
                    <span className="text-gray-600 ml-2 text-lg">/session</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {[
                      { text: "One-on-one expert tutoring", icon: Target },
                      { text: "Fully customized schedule", icon: Clock },
                      { text: "Personal learning plan", icon: Brain },
                      { text: "Priority support access", icon: Star },
                      { text: "Flexible session timing", icon: Calendar }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center">
                        <item.icon className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    to="/signup"
                    className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Start Private Tutoring
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1600&q=80')] opacity-10 mix-blend-overlay"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">LIMITED TIME OFFER</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Academic Journey?
          </h2>
          
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of successful students who achieved their academic goals with us
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="group bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2"
            >
              <Logo size="cta" link={false} className="h-24 w-24" />
              <span className="text-lg">Start Free Trial</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/login"
              className="bg-white/20 backdrop-blur-sm text-white px-10 py-4 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 border-2 border-white/40 text-lg"
            >
              Book a Consultation
            </Link>
          </div>
          
          <p className="text-blue-200 mt-8 text-sm">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Logo size="footer" link={false} />
            </div>
            
            <p className="text-gray-400 text-center text-lg">
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
            
            <div className="flex space-x-6 mt-6 md:mt-0 text-lg">
              <Link to="/login" className="text-gray-400 hover:text-white transition">Privacy</Link>
              <Link to="/login" className="text-gray-400 hover:text-white transition">Terms</Link>
              <Link to="/login" className="text-gray-400 hover:text-white transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;