import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { Auction, Category } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchAdminAuctions(token: string): Promise<Auction[]> {
  const response = await fetch(`${API_BASE}/auctions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error("Failed to load auctions");
  }
  return response.json();
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/catalog/categories`);
  if (!response.ok) {
    throw new Error("Failed to load categories");
  }
  return response.json();
}

const adminGuidelines = [
  "Upload a hero photo plus three detail shots for every machine.",
  "Double-check the anti-sniping window—bidders expect at least two minutes.",
  "Set realistic starting prices to maximise engagement before the countdown.",
  "Publish before Wednesday 4 PM CT to appear in the Thursday email blast.",
];

export function AdminDashboard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    location: "",
    starting_price: 0,
    start_time: dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm"),
    end_time: dayjs().add(2, "hour").format("YYYY-MM-DDTHH:mm"),
    sniping_extension_minutes: 3,
    sniping_window_minutes: 3,
  });
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ["admin-auctions"],
    queryFn: () => fetchAdminAuctions(token!),
    enabled: Boolean(token)
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/auctions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          starting_price: Number(form.starting_price),
          sniping_extension_minutes: Number(form.sniping_extension_minutes),
          sniping_window_minutes: Number(form.sniping_window_minutes),
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          gallery_urls: gallery,
          category_slugs: selectedCategories,
        })
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({ detail: "Unable to create auction" }));
        throw new Error(message.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setGallery([]);
      setSelectedCategories([]);
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    }
  });

  const handleGalleryUpload = async (file: File) => {
    if (!token) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await fetch(`${API_BASE}/media/auction`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(message.detail);
      }
      const data = await response.json();
      setGallery((current) => [...current, data.url]);
      if (!form.image_url) {
        setForm((prev) => ({ ...prev, image_url: data.url }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section>
      <h1>Admin dashboard</h1>
      <div className="form-card">
        <h2>Create auction</h2>
        <label>
          Title
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label>
          Description
          <textarea
            rows={5}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <label>
          Location
          <input
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            placeholder="City, State"
          />
        </label>
        <fieldset className="checkbox-fieldset">
          <legend>Categories</legend>
          <p className="muted">
            Select the equipment lanes this lot should appear in. Choose up to three.
          </p>
          <div className="checkbox-grid">
            {categories?.map((category) => {
              const checked = selectedCategories.includes(category.slug);
              const disabled = !checked && selectedCategories.length >= 3;
              return (
                <label
                  key={category.slug}
                  className={disabled ? "checkbox-option disabled" : "checkbox-option"}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => {
                      setSelectedCategories((current) => {
                        if (event.target.checked) {
                          return [...current, category.slug];
                        }
                        return current.filter((slug) => slug !== category.slug);
                      });
                    }}
                  />
                  <span>{category.name}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <label>
          Image URL
          <input
            value={form.image_url}
            onChange={(event) => setForm({ ...form, image_url: event.target.value })}
          />
        </label>
        <div className="upload-group">
          <label className="upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  handleGalleryUpload(event.target.files[0]);
                }
              }}
            />
            {uploading ? "Uploading…" : "Add photo"}
          </label>
          {gallery.length > 0 && (
            <div className="thumb-row">
              {gallery.map((url) => (
                <div key={url} className="thumb">
                  <img src={url} alt="Auction gallery" />
                  <button
                    type="button"
                    onClick={() => setGallery((current) => current.filter((entry) => entry !== url))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <label>
          Starting price
          <input
            type="number"
            value={form.starting_price}
            onChange={(event) => setForm({ ...form, starting_price: Number(event.target.value) })}
          />
        </label>
        <label>
          Start time
          <input
            type="datetime-local"
            value={form.start_time}
            onChange={(event) => setForm({ ...form, start_time: event.target.value })}
          />
        </label>
        <label>
          End time
          <input
            type="datetime-local"
            value={form.end_time}
            onChange={(event) => setForm({ ...form, end_time: event.target.value })}
          />
        </label>
        <label>
          Anti-sniping extension (minutes)
          <input
            type="number"
            value={form.sniping_extension_minutes}
            onChange={(event) => setForm({ ...form, sniping_extension_minutes: Number(event.target.value) })}
          />
        </label>
        <label>
          Sniping window (minutes)
          <input
            type="number"
            value={form.sniping_window_minutes}
            onChange={(event) => setForm({ ...form, sniping_window_minutes: Number(event.target.value) })}
          />
        </label>
        <button onClick={() => createMutation.mutate()} disabled={createMutation.isLoading}>
          {createMutation.isLoading ? "Creating…" : "Create auction"}
        </button>
        {createMutation.error && (
          <p style={{ color: "tomato" }}>{(createMutation.error as Error).message}</p>
        )}
      </div>

      <section>
        <h2>Existing listings</h2>
        {data?.length ? (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Status</th>
                <th>Current price</th>
                <th>Ends</th>
                <th>Categories</th>
              </tr>
            </thead>
            <tbody>
              {data.map((auction) => (
                <tr key={auction.id}>
                  <td>{auction.title}</td>
                  <td>{auction.location ?? "—"}</td>
                  <td>{auction.status}</td>
                  <td>${auction.current_price.toFixed(2)}</td>
                  <td>{dayjs(auction.end_time).format("MMM D, YYYY h:mm A")}</td>
                  <td className="muted">
                    {auction.categories.length
                      ? auction.categories.map((category) => category.name).join(", ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No auctions created yet.</p>
        )}
      </section>

      <section className="dashboard-help">
        <article className="info-card">
          <h2>Listing checklist</h2>
          <ul className="checklist">
            {adminGuidelines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="info-card">
          <h2>Need marketing support?</h2>
          <p>
            Email <a href="mailto:marketing@fesauction.com">marketing@fesauction.com</a> to feature your sale in the weekly
            classifieds newsletter, or request a custom landing page for high-value consignments.
          </p>
        </article>
      </section>
    </section>
  );
}
