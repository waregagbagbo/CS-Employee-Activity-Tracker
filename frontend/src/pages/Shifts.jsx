import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Users, Plus, X, Edit, Trash2,
  CheckCircle, AlertCircle, TrendingUp, Filter, Search, ChevronRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ShiftService from '../services/shifts';

const ShiftsDashboard = () => {
  const [activeView, setActiveView] = useState('upcoming');
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userType = localStorage.getItem("user_role") || "Employee";
  const user = localStorage.getItem("username") || "Agent";

  const [selectedShift, setSelectedShift] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchShifts = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    let response;
    switch(activeView) {
      case 'today':
        response = await ShiftService.getTodayShifts();
        // Your backend returns { date: ..., shifts: [...] }
        setShifts(response.shifts || []);
        break;
      case 'upcoming':
        response = await ShiftService.getUpcomingShifts();
        // Your backend returns { start_date: ..., shifts: [...] }
      setShifts(response.shifts || []);
        break;
      case 'my-shifts':
        response = await ShiftService.getMyShifts();
        // Your backend returns { employee: ..., shifts: [...] }
        setShifts(response.shifts || []);
        break;
      case 'all':
        const data = filterStatus !== 'all'
          ? await ShiftService.getShiftsByStatus(filterStatus)
          : await ShiftService.list();
        // Standard list returns { results: [...] } because of PageNumberPagination
        setShifts(data.results || data || []);
        break;
    }
  } catch (err) {
    console.error(err);
    setError('Terminal Link Failure');
  } finally {
    setLoading(false);
  }
}, [activeView, filterStatus]);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const handleCancelShift = async (id) => {
    if (window.confirm('Terminate this shift allocation?')) {
      await ShiftService.cancelShift(id);
      fetchShifts();
    }
  };

  const formatTime = (ts) => ts ? new Date(`2000-01-01T${ts}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  const formatDate = (ds) => ds ? new Date(ds).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : '-';

  if (loading) return (
    <div className="flex bg-[#F9FAFB] h-screen">
      <Sidebar /><div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse text-gray-400">Syncing Schedules...</div>
    </div>
  );

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Operations Schedule" user={user} />

        <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 pb-32">

          {/* HEADER SECTION */}
          <section className="bg-black p-8 rounded-[2.5rem] shadow-2xl text-white flex flex-col lg:flex-row justify-between items-center gap-6 border-b-4 border-[#FFCC00]">
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#FFCC00]">Deployment Log</h1>
              <p className="text-gray-400 font-mono text-[10px] uppercase tracking-[0.2em] mt-1">Personnel Shift Management Terminal</p>
            </div>

            {['Supervisor', 'Manager', 'Admin'].includes(userType) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#FFCC00] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-white transition-all shadow-xl"
              >
                <Plus size={16} /> New Deployment
              </button>
            )}
          </section>

          {/* VIEW NAVIGATION & FILTERS */}
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 p-1 bg-gray-200/50 rounded-2xl w-full xl:w-fit overflow-x-auto">
              {['today', 'upcoming', 'my-shifts', 'all'].map(view => (
                (view !== 'all' || ['Supervisor', 'Manager', 'Admin'].includes(userType)) && (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      activeView === view ? "bg-black text-[#FFCC00] shadow-md" : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {view.replace('-', ' ')}
                  </button>
                )
              ))}
            </div>

            {activeView === 'all' && (
              <div className="flex gap-4 w-full xl:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search Agents..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In_Progress">Active</option>
                  <option value="Shift_Completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          {/* SHIFTS GRID */}
          {shifts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shifts.map((shift) => (
                <div key={shift.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-[#FFCC00] transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        {shift.shift_type} Shift
                      </span>
                      <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                        {formatDate(shift.shift_date)}
                      </h3>
                    </div>
                    <StatusBadge status={shift.shift_status} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                      <div className="w-8 h-8 bg-black text-[#FFCC00] rounded-full flex items-center justify-center font-black text-[10px]">
                        {shift.shift_agent?.user?.username?.[0] || 'A'}
                      </div>
                      <span className="font-bold text-xs uppercase italic">
                        {shift.shift_agent?.user?.username || 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase font-mono">
                          {formatTime(shift.shift_start_time)} - {formatTime(shift.shift_end_time)}
                        </span>
                      </div>
                      <span className="text-[9px] font-black bg-gray-100 px-2 py-1 rounded">
                        {shift.duration_hours}H
                      </span>
                    </div>

                    {shift.attendance_status && (
                      <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest mb-1 text-gray-400">
                          <span>Execution Status</span>
                          <span className={shift.attendance_status.status === 'completed' ? 'text-green-500' : 'text-orange-500'}>
                            {shift.attendance_status.status}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-black h-full transition-all"
                            style={{ width: `${(shift.attendance_status.hours_worked / shift.attendance_status.scheduled_hours) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ADMIN ACTIONS */}
                  {['Supervisor', 'Manager', 'Admin'].includes(userType) && shift.shift_status === 'Scheduled' && (
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => setSelectedShift(shift)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-black hover:text-white p-3 rounded-xl transition-all text-gray-500"
                      >
                        <Edit size={14} /> <span className="text-[9px] font-black uppercase">Edit</span>
                      </button>
                      <button
                        onClick={() => handleCancelShift(shift.id)}
                        className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-gray-200">
              <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="font-black uppercase tracking-widest text-gray-400">No Deployments Found</h3>
              <p className="text-xs text-gray-400 mt-2">Check different filter or create a new shift</p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL PLACEHOLDER STYLE */}
      {(showCreateModal || selectedShift) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           {/* ShiftModal component would go here, styled similarly to the cards */}
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#FFCC00]"></div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                  {selectedShift ? 'Edit Deployment' : 'New Deployment'}
                </h2>
                <button onClick={() => {setShowCreateModal(false); setSelectedShift(null)}} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              {/* Form elements from your previous code but with Tailwind border-gray-100 and rounded-2xl */}
              <p className="text-center py-10 text-gray-400 uppercase font-black tracking-widest text-[10px]">Form Terminal Ready</p>
           </div>
        </div>
      )}
    </div>
  );
};

/* HELPER COMPONENTS */

const StatusBadge = ({ status }) => {
  const config = {
    'Scheduled': 'bg-blue-50 text-blue-600',
    'In_Progress': 'bg-green-50 text-green-600 animate-pulse',
    'Shift_Completed': 'bg-gray-100 text-gray-500',
    'Cancelled': 'bg-rose-50 text-rose-500',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${config[status] || config.Scheduled}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default ShiftsDashboard;