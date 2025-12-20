import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // if you want to get id from URL
import { retrieveProfile } from '../services/profile';

export default function Profile() {
  const { id } = useParams(); // grabs :id from the route (e.g. /employee/1)
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await retrieveProfile(id); // axios GET call
        setProfile(response.data);
      } catch (err) {
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>{profile?.username}</h1>
      <p>Email: {profile?.email}</p>
      <p>Department: {profile?.department?.title}</p>
      <p>Bio: {profile?.bio}</p>
      <p>User Type: {profile?.user_type}</p>
    </div>
  );
}