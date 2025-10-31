import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Auction } from "../types";

dayjs.extend(relativeTime);
dayjs.extend(duration);

type Props = {
  auction: Auction;
};

const statusLabel: Record<string, string> = {
  active: "Live",
  upcoming: "Opens soon",
  completed: "Closed"
};

export function AuctionCard({ auction }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const closing = dayjs(auction.end_time).format("MMM D, YYYY h:mm A");
  const starting = dayjs(auction.start_time).format("MMM D, YYYY h:mm A");

  const timeRemaining = useMemo(() => {
    if (auction.status === "completed") {
      return `Closed ${dayjs(auction.end_time).fromNow()}`;
    }
    if (auction.status === "upcoming") {
      return `Opens ${dayjs(auction.start_time).fromNow()}`;
    }
    const durationLeft = dayjs.duration(auction.time_remaining_seconds, "seconds");
    const hours = Math.floor(durationLeft.asHours());
    const minutes = durationLeft.minutes();
    return `${hours}h ${minutes}m left`;
  }, [auction]);

  const gallery = auction.gallery.slice(0, 4);

  return (
    <article className="search_result grid">
      <div className="grid_element">
        <div className="img_section">
          {auction.image_url ? (
            <img className="search_result_image" src={auction.image_url} alt={auction.title} />
          ) : (
            <div className="image-placeholder">Photo coming soon</div>
          )}
        </div>
        <div className="result_content mid_section">
          <div className="btn-sm bg-primary line-height-xl bold no-radius-bottom">
            <span className="pull-left">{statusLabel[auction.status]}</span>
            <span className="pull-right badge">{timeRemaining}</span>
            <div className="clearfix" />
          </div>
          <div className="favorite_button" aria-hidden>
            <button className="favorite fa fa-star-o" type="button" />
          </div>
          <h3 className="h3">
            <Link to={`/auctions/${auction.id}`}>{auction.title}</Link>
          </h3>
          <div className={`post-location-snippet ${auction.location ? "" : "no-location"}`}>
            <i className="fa fa-map-marker" aria-hidden />
            {auction.location ?? "Location provided after contact"}
          </div>
          {auction.categories.length > 0 && (
            <ul className="category-chip-row">
              {auction.categories.slice(0, 3).map((category) => (
                <li key={category.id}>{category.name}</li>
              ))}
              {auction.categories.length > 3 && (
                <li className="more-chip">+{auction.categories.length - 3}</li>
              )}
            </ul>
          )}
          <div className="post-hours-container">
            <strong>Current bid:</strong> ${auction.current_price.toLocaleString()}
          </div>
          <div className="post-extra-container">
            Seller: {auction.owner.display_name}
          </div>
          <div className={`post-details-container${showDetails ? " expanded" : ""}`}>
            <button className="details-toggle" type="button" onClick={() => setShowDetails((value) => !value)}>
              Listing details
            </button>
            <div className="details-content">
              <p>
                {auction.description.length > 280
                  ? `${auction.description.slice(0, 280)}…`
                  : auction.description}
              </p>
              <ul>
                <li>Opens: {starting}</li>
                <li>Closes: {closing}</li>
                <li>{auction.bids.length} bids received</li>
                <li>Anti-sniping window: {auction.sniping_window_minutes} min</li>
              </ul>
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="gallery-strip">
              {gallery.map((image) => (
                <img key={image.id} src={image.url} alt={`${auction.title} thumbnail`} />
              ))}
            </div>
          )}
          <div className="hidden-xs row-fluid bpad">
            <Link className="btn btn-default view-details" to={`/auctions/${auction.id}`}>
              View listing
            </Link>
            <span className="posted_meta_data">Updated {dayjs(auction.updated_at).fromNow()}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
