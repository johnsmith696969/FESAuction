import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const sellerChecklist = [
  "Confirm your dealership address and VAT/tax ID",
  "Upload at least three gallery photos for each listing",
  "Set a contact phone number so carriers can reach you",
  "Add team members who should receive buyer messages",
];

export function ProfilePage() {
  const { user, token, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          location,
          phone,
          avatar_url: avatarUrl || null,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      return response.json();
    },
    onSuccess: async (updatedUser: any) => {
      setDisplayName(updatedUser.display_name);
      setBio(updatedUser.bio ?? "");
      setLocation(updatedUser.location ?? "");
      setPhone(updatedUser.phone ?? "");
      setAvatarUrl(updatedUser.avatar_url ?? "");
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    }
  });

  if (!user) return null;

  const handleAvatarUpload = async (file: File) => {
    if (!token) return;
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      const response = await fetch(`${API_BASE}/media/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const data = await response.json();
      setAvatarUrl(data.url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section>
      <h1>Your profile</h1>
      <div className="profile-header-card">
        <div className="avatar-column">
          <div className="avatar-preview">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${displayName}'s avatar`} />
            ) : (
              <div className="avatar-placeholder">{displayName.slice(0, 1).toUpperCase()}</div>
            )}
          </div>
          <label className="upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  handleAvatarUpload(event.target.files[0]);
                }
              }}
            />
            {isUploading ? "Uploading…" : avatarUrl ? "Update avatar" : "Upload avatar"}
          </label>
        </div>
        <div className="profile-meta">
          <p className="muted">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          <p className="muted">Email: {user.email}</p>
          <p className="muted">Location: {location || "Not set"}</p>
          {phone && <p className="muted">Phone: {phone}</p>}
        </div>
      </div>
      <div className="form-card">
        <label>
          Display name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label>
          Bio
          <textarea rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
        </label>
        <label>
          Location
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Where are you selling from?" />
        </label>
        <label>
          Phone number
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Share a direct line (optional)" />
        </label>
        <button onClick={() => mutation.mutate()} disabled={mutation.isLoading}>
          {mutation.isLoading ? "Saving…" : "Save profile"}
        </button>
        {mutation.error && <p style={{ color: "tomato" }}>{(mutation.error as Error).message}</p>}
      </div>

      <section className="info-grid">
        <article className="info-card">
          <h2>Seller spotlight</h2>
          <p>
            Dealerships with complete bios and contact details close deals 32% faster. Share what you specialise in—equipment
            categories, service packages, and financing options—to win buyer confidence.
          </p>
        </article>
        <article className="info-card">
          <h2>Profile checklist</h2>
          <ul className="checklist">
            {sellerChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="info-card">
          <h2>Need assistance?</h2>
          <p>
            Email <a href="mailto:support@fesauction.com">support@fesauction.com</a> or call <strong>1-800-FES-SALE</strong>
            for help onboarding your sales team or importing bulk listings.
          </p>
        </article>
      </section>
    </section>
  );
}
