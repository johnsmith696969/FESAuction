export type User = {
  id: number;
  email: string;
  display_name: string;
  bio: string;
  location: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Bid = {
  id: number;
  amount: number;
  created_at: string;
  bidder: User;
};

export type Auction = {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  location: string | null;
  starting_price: number;
  current_price: number;
  start_time: string;
  end_time: string;
  sniping_extension_minutes: number;
  sniping_window_minutes: number;
  owner: User;
  created_at: string;
  updated_at: string;
  bids: Bid[];
  gallery: AuctionImage[];
  status: "active" | "upcoming" | "completed";
  time_remaining_seconds: number;
  categories: Category[];
};

export type AuctionImage = {
  id: number;
  url: string;
  position: number;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

export type SupportProgram = {
  slug: string;
  name: string;
  summary: string;
  category: "transport" | "financing" | "inspection";
  contact_email: string;
  contact_phone: string;
  turnaround: string;
};

export type TransportQuote = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  origin: string;
  destination: string;
  equipment_type: string | null;
  weight: string | null;
  timeline: string | null;
  notes: string | null;
  auction_id: number | null;
  created_at: string;
};

export type FinancingApplication = {
  id: number;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  amount: number;
  timeline: string | null;
  notes: string | null;
  auction_id: number | null;
  status: string;
  created_at: string;
};

export type Message = {
  id: number;
  body: string;
  created_at: string;
  auction_id: number | null;
  sender: User;
  recipient: User;
};

export type ContactRequest = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  topic: string | null;
  message: string;
  created_at: string;
};
