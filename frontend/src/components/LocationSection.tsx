import { Link } from 'react-router-dom';

export default function LocationSection() {
  return (
    <section className="py-16 lg:py-24 bg-body border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-accent-primary">
            Explore by location
          </h2>
          <p className="mt-3 text-accent-muted">
            Select a district and place to see real-time zone-wise crowd status on the map.
          </p>
          <Link
            to="/location"
            className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full bg-header text-white font-semibold hover:bg-header-dark transition-colors"
          >
            Open location map
          </Link>
        </div>
      </div>
    </section>
  );
}
