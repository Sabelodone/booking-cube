import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  X,
  Sparkles,
  Shield,
  Filter,
  Loader2,
  ChevronRight,
  Zap,
  GraduationCap
} from 'lucide-react';

// Define types for session and booking
interface Session {
  id: string;
  session_type: 'group' | 'one_on_one';
  subject: 'Maths' | 'Physical Sciences';
  date: string;
  start_time: string;
  duration_minutes: number;
  price: number;
  max_students: number;
  current_bookings: number;
  available: boolean;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const BookClass: React.FC = () => {
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [booking, setBooking] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, selectedType, selectedSubject]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get<Session[]>(`${API}/sessions`, {
        params: { available_only: true }
      });
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    if (selectedType !== 'all') {
      filtered = filtered.filter(s => s.session_type === selectedType);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(s => s.subject === selectedSubject);
    }

    setFilteredSessions(filtered);
  };

  const handleBookClick = (session: Session) => {
    setSelectedSession(session);
    setShowModal(true);
  };

  const handleBookConfirm = async () => {
    if (!selectedSession) return;
    
    setBooking(true);

    try {
      await axios.post(
        `${API}/bookings`,
        {
          session_id: selectedSession.id,
          student_notes: studentNotes || null
        },
        { headers: getAuthHeader() }
      );

      setShowModal(false);
      navigate('/my-bookings');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Navigation */}
        <nav className="relative bg-white/80 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">TutorHub</span>
              </div>
              <div className="flex items-center space-x-6">
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link>
                <Link to="/book" className="text-blue-600 font-medium">Book Class</Link>
                <Link to="/my-bookings" className="text-gray-600 hover:text-gray-900 transition-colors">My Bookings</Link>
                <Link to="/profile" className="text-gray-600 hover:text-gray-900 transition-colors">Profile</Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-8">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">TutorHub</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link>
              <Link to="/book" className="text-blue-600 font-medium">Book Class</Link>
              <Link to="/my-bookings" className="text-gray-600 hover:text-gray-900 transition-colors">My Bookings</Link>
              <Link to="/profile" className="text-gray-600 hover:text-gray-900 transition-colors">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  Book a Class
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                  Choose from our available sessions below
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Filter Sessions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">All Types</option>
                  <option value="group">Group Classes (Sundays)</option>
                  <option value="one_on_one">1-on-1 Sessions (Weekdays)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">All Subjects</option>
                  <option value="Maths">Maths</option>
                  <option value="Physical Sciences">Physical Sciences</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-12 text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                  <Calendar className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Available Sessions</h3>
                <p className="text-gray-600">Check back later for new sessions</p>
              </div>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="group relative perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/20 transform-gpu transition-all duration-500 group-hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>
                  
                  <div className="relative p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                            session.session_type === 'group'
                              ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200/50'
                              : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200/50'
                          }`}>
                            {session.session_type === 'group' ? 'Group Class' : '1-on-1 Session'}
                          </span>
                          <span className="text-gray-400">|</span>
                          <span className="font-semibold text-gray-900">{session.subject}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <span className="text-sm">{session.date}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="h-5 w-5 text-purple-500" />
                            <span className="text-sm">{session.start_time} ({session.duration_minutes} mins)</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Users className="h-5 w-5 text-orange-500" />
                            <span className="text-sm">{session.current_bookings}/{session.max_students} students</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 mr-1">Rands:</span>
                            <span className="text-xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                              {session.price}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBookClick(session)}
                        className="group/btn relative perspective-1000"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px]">
                          Book Now
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Confirm Booking
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50/50 backdrop-blur-sm rounded-xl border border-blue-200/50">
                    <p className="text-sm text-gray-600 mb-1">Subject</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedSession.subject}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50/50 backdrop-blur-sm rounded-xl border border-purple-200/50">
                      <p className="text-sm text-gray-600 mb-1">Type</p>
                      <p className="font-semibold text-gray-900">
                        {selectedSession.session_type === 'group' ? 'Group Class' : '1-on-1'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 backdrop-blur-sm rounded-xl border border-green-200/50">
                      <p className="text-sm text-gray-600 mb-1">Price (Rands)</p>
                      <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                        {selectedSession.price}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50/50 backdrop-blur-sm rounded-xl border border-yellow-200/50">
                    <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {selectedSession.date} at {selectedSession.start_time}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Duration: {selectedSession.duration_minutes} minutes
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={studentNotes}
                      onChange={(e) => setStudentNotes(e.target.value)}
                      placeholder="Any specific topics you'd like to focus on?"
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookConfirm}
                    disabled={booking}
                    className="group/btn relative flex-1 perspective-1000"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px] disabled:opacity-50">
                      {booking ? 'Booking...' : 'Confirm Booking'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        .animate-shine {
          animation: shine 6s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default BookClass;