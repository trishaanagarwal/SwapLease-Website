import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Edit2, Save, X, PlusCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', bio: '', university: '', phone: '' });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', bio: user.bio || '', university: user.university || '', phone: user.phone || '' });
    }
    api.get('/listings', { params: {} })
      .then(res => setListings(res.data.filter(l => l.userId === user?.id)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/users/me', form);
      updateUser(res.data);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-2xl">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{user?.name}</h1>
                <p className="text-slate-500 text-sm">{user?.email}</p>
              </div>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                <Edit2 size={14} /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-lg">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-sm text-white bg-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}

          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">University</label>
                <input value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} placeholder="e.g. University of Melbourne" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="04XX XXX XXX" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Tell others a bit about yourself..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {user?.university && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">University</div>
                  <div className="text-slate-800 font-medium">{user.university}</div>
                </div>
              )}
              {user?.phone && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Phone</div>
                  <div className="text-slate-800 font-medium">{user.phone}</div>
                </div>
              )}
              {user?.bio && (
                <div className="p-3 bg-slate-50 rounded-xl md:col-span-2">
                  <div className="text-xs text-slate-500 mb-1">Bio</div>
                  <div className="text-slate-800">{user.bio}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">My Listings</h2>
            <Link to="/create-listing" className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              <PlusCircle size={16} /> New Listing
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => <div key={i} className="h-72 bg-white rounded-2xl animate-pulse border border-slate-100"></div>)}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User size={24} className="text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">No listings yet</h3>
              <p className="text-slate-500 text-sm mb-4">Post your first lease transfer listing</p>
              <Link to="/create-listing" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <PlusCircle size={16} /> Create Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
