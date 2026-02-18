import { Link } from 'react-router-dom';
import { 
  Clock, Users, CheckCircle, Calendar, 
  DollarSign, Award, Target, BarChart, Star, Shield,
  ArrowRight, Sparkles, GraduationCap, Brain, Zap, TrendingUp, BookOpen
} from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      {/* Navigation - Modern Design */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link to="/" className="flex items-center space-x-2 group">
              <Logo size="navigation" link={false} />
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                to="/login"
                className="group relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-300 hidden md:block text-lg"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <span className="relative">Login</span>
              </Link>
              <Link
                to="/signup"
                className="group relative perspective-1000"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3.5 rounded-xl font-medium transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px] text-lg">
                  <span className="relative flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Start Learning</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern Design */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-blue-100">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  INTELLIGENT TUTORING PLATFORM
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Master{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Maths</span>{' '}
                &{' '}
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">Science</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your academic performance with our intelligent tutoring system. 
                Get personalized learning paths, expert guidance, and proven results.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="group relative perspective-1000"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                    <span className="relative flex items-center justify-center space-x-2">
                      <GraduationCap className="h-5 w-5" />
                      <span>Start Free Trial</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
                <Link
                  to="/login"
                  className="group relative perspective-1000"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px] border-2 border-gray-200 group-hover:border-blue-300">
                    <span className="flex items-center justify-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>See How It Works</span>
                    </span>
                  </div>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                {[
                  { value: '98%', label: 'Pass Rate', color: 'from-green-500 to-emerald-500', icon: Award },
                  { value: '2.1x', label: 'Grade Boost', color: 'from-blue-500 to-cyan-500', icon: TrendingUp },
                  { value: '500+', label: 'Students', color: 'from-purple-500 to-pink-500', icon: Users }
                ].map((stat, index) => (
                  <div key={index} className="group relative perspective-1000">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center transform-gpu transition-all duration-300 group-hover:scale-105 border border-gray-100">
                      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${stat.color} mb-2`}>
                        <stat.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 transform-gpu transition-all duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>
                
                <div className="relative">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                      <Logo size="small" link={false} className="h-10 w-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Live Session Dashboard</h3>
                      <p className="text-gray-500 text-lg">Interactive learning experience</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { time: 'Today, 3:00 PM', subject: 'Advanced Calculus', status: 'upcoming', color: 'from-blue-500 to-indigo-500' },
                      { time: 'Tomorrow, 10:00 AM', subject: 'Organic Chemistry', status: 'scheduled', color: 'from-purple-500 to-pink-500' },
                      { time: 'Sunday, 2:00 PM', subject: 'Physics Workshop', status: 'group', color: 'from-green-500 to-emerald-500' }
                    ].map((session, index) => (
                      <div key={index} className="group/session relative perspective-1000">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover/session:opacity-20 transition-opacity"></div>
                        <div className="relative bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 transform-gpu transition-all duration-300 group-hover/session:scale-105">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${session.color}`}></div>
                              <div>
                                <div className="font-medium text-gray-900">{session.subject}</div>
                                <div className="text-sm text-gray-500">{session.time}</div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${session.color} text-white`}>
                              {session.status}
                            </div>
                          </div>
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
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-blue-100">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WHY CHOOSE US?
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Intelligent{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning</span>{' '}
              Experience
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
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Users,
                title: "Collaborative Learning",
                description: "Interactive group sessions with peer-to-peer learning",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Shield,
                title: "Expert Verified",
                description: "All tutors are certified educators with proven track records",
                gradient: "from-orange-500 to-amber-500"
              },
              {
                icon: Brain,
                title: "AI-Powered Analytics",
                description: "Smart analysis of learning patterns and weak areas",
                gradient: "from-blue-500 to-cyan-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative perspective-1000"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 transform-gpu transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                  
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 transform-gpu transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Modern */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-green-100">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                FLEXIBLE PLANS
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning</span>{' '}
              Path
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Group Plan */}
            <div className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 transform-gpu transition-all duration-500 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                {/* Popular Badge */}
                <div className="absolute top-8 right-8">
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium shadow-lg">
                    MOST POPULAR
                  </div>
                </div>
                
                <div className="relative p-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      GROUP LEARNING
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Collective Mastery</h3>
                  <p className="text-gray-600 mb-6">Learn together, grow together</p>
                  
                  <div className="flex items-baseline mb-8">
                    <span className="text-5xl font-bold text-gray-900">500</span>
                    <span className="text-gray-600 ml-2 text-lg">Rands/session</span>
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
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1 rounded-full mr-3">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    to="/signup"
                    className="group/btn relative block w-full perspective-1000"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-4 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px]">
                      Join Group Plan
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* 1-on-1 Plan */}
            <div className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 transform-gpu transition-all duration-500 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                {/* Premium Badge */}
                <div className="absolute top-8 right-8">
                  <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium shadow-lg">
                    PREMIUM
                  </div>
                </div>
                
                <div className="relative p-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      PERSONALIZED
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Private Excellence</h3>
                  <p className="text-gray-600 mb-6">Your journey, your pace</p>
                  
                  <div className="flex items-baseline mb-8">
                    <span className="text-5xl font-bold text-gray-900">200</span>
                    <span className="text-gray-600 ml-2 text-lg">Rands/session</span>
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
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1 rounded-full mr-3">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    to="/signup"
                    className="group/btn relative block w-full perspective-1000"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-4 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px]">
                      Start Private Tutoring
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1600&q=80')] opacity-10 mix-blend-overlay"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-white/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-white/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
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
              className="group relative perspective-1000"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                <span className="flex items-center space-x-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
            
            <Link
              to="/login"
              className="group relative perspective-1000"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-white/20 backdrop-blur-sm text-white px-10 py-4 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px] border-2 border-white/40">
                <span className="text-lg">Book a Consultation</span>
              </div>
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

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-shine {
          animation: shine 6s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;