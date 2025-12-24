import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { retrieveProfile, updateProfile } from "../services/profile";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaBell,
  FaPalette,
  FaShieldAlt,
  FaSave,
  FaTimes,
  FaCheck,
  FaCog,
  FaExclamationTriangle
} from "react-icons/fa";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Profile Settings
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });

  // Password Settings
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    shift_reminders: true,
    report_updates: false,
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    language: "en",
    timezone: "UTC",
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const data = await retrieveProfile();
      setProfileData({
        username: data.username || "",
        email: data.email || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile(profileData);
      setSuccess("Profile updated successfully!");

      // Update localStorage
      localStorage.setItem("username", profileData.username);
      localStorage.setItem("email", profileData.email);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("New passwords do not match!");
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError("Password must be at least 8 characters long!");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token') ||
                    localStorage.getItem('authToken') ||
                    localStorage.getItem('access');

      const response = await axios.post(
        'http://127.0.0.1:8000/api/password/change/',
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(response.data.message || "Password updated successfully!");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Password change error:", err);
      const errorMsg = err.response?.data?.error || "Failed to update password. Please check your current password.";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = () => {
    setSaving(true);
    setSuccess("");

    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings));
      setSuccess("Notification preferences saved!");
      setSaving(false);
      setTimeout(() => setSuccess(""), 3000);
    }, 500);
  };

  const handleAppearanceSave = () => {
    setSaving(true);
    setSuccess("");

    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("appearanceSettings", JSON.stringify(appearanceSettings));
      setSuccess("Appearance settings saved!");
      setSaving(false);
      setTimeout(() => setSuccess(""), 3000);
    }, 500);
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: <FaUser /> },
    { id: "password", name: "Password", icon: <FaLock /> },
    { id: "notifications", name: "Notifications", icon: <FaBell /> },
    { id: "appearance", name: "Appearance", icon: <FaPalette /> },
  ];

  if (loading) {
    return <Loader fullPage message="Loading settings..." />;
  }

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <FaCog className="mr-3 text-indigo-600" />
                    Settings
                  </h1>
                  <p className="text-gray-600 mt-1">Manage your account preferences</p>
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start animate-pulse">
                <FaCheck className="mr-2 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <FaExclamationTriangle className="mr-2 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Tabs */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-4 space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-md p-8">

                  {/* Profile Tab */}
                  {activeTab === "profile" && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
                      <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Username */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Username
                            </label>
                            <div className="relative">
                              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={profileData.username}
                                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                disabled
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <div className="relative">
                              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          {/* First Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={profileData.first_name}
                              onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>

                          {/* Last Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={profileData.last_name}
                              onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-6 border-t">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <FaSave />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Password Tab */}
                  {activeTab === "password" && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
                      <form onSubmit={handlePasswordUpdate} className="space-y-6">
                        {/* Current Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="password"
                              value={passwordData.current_password}
                              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="password"
                              value={passwordData.new_password}
                              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                              minLength={8}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="password"
                              value={passwordData.confirm_password}
                              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <FaSave />
                                <span>Update Password</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Preferences</h2>
                      <div className="space-y-6">
                        {/* Email Notifications */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-gray-800">Email Notifications</h3>
                            <p className="text-sm text-gray-600">Receive notifications via email</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.email_notifications}
                              onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {/* Push Notifications */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-gray-800">Push Notifications</h3>
                            <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.push_notifications}
                              onChange={(e) => setNotificationSettings({ ...notificationSettings, push_notifications: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {/* Shift Reminders */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-gray-800">Shift Reminders</h3>
                            <p className="text-sm text-gray-600">Get reminded about upcoming shifts</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.shift_reminders}
                              onChange={(e) => setNotificationSettings({ ...notificationSettings, shift_reminders: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {/* Report Updates */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-gray-800">Report Updates</h3>
                            <p className="text-sm text-gray-600">Notify when reports are ready</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.report_updates}
                              onChange={(e) => setNotificationSettings({ ...notificationSettings, report_updates: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-6 border-t">
                          <button
                            onClick={handleNotificationSave}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                          >
                            <FaSave />
                            <span>Save Preferences</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Appearance Tab */}
                  {activeTab === "appearance" && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Appearance Settings</h2>
                      <div className="space-y-6">
                        {/* Theme */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Theme
                          </label>
                          <select
                            value={appearanceSettings.theme}
                            onChange={(e) => setAppearanceSettings({ ...appearanceSettings, theme: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark (Coming Soon)</option>
                            <option value="auto">Auto (System)</option>
                          </select>
                        </div>

                        {/* Language */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                          </label>
                          <select
                            value={appearanceSettings.language}
                            onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                          </select>
                        </div>

                        {/* Timezone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select
                            value={appearanceSettings.timezone}
                            onChange={(e) => setAppearanceSettings({ ...appearanceSettings, timezone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                          </select>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-6 border-t">
                          <button
                            onClick={handleAppearanceSave}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                          >
                            <FaSave />
                            <span>Save Settings</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}