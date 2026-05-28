import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-16 space-y-6">
        <h1 className="text-4xl font-extrabold text-brand-900 leading-tight">
          Travel with Confidence.<br />Never Fly Alone.
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          FlightBuddy connects elderly solo travellers with kind volunteers on the same flight for assistance, companionship, and peace of mind.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/request"
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl text-xl shadow-lg transition"
          >
            I Need Help Travelling
          </Link>
          <Link
            href="/volunteer"
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl text-xl shadow-lg transition"
          >
            I Want to Volunteer
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center text-brand-900">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', icon: '📋', title: 'Post Your Trip', desc: 'Share your flight details — route, date, airline, and language preference.' },
            { step: '2', icon: '🤝', title: 'Get Matched', desc: 'Volunteers on the same flight offer to help. You confirm the match.' },
            { step: '3', icon: '📞', title: 'Connect Safely', desc: 'Once confirmed, exchange contact details and travel together with confidence.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl p-8 shadow text-center space-y-3">
              <div className="text-5xl">{icon}</div>
              <div className="text-sm font-bold text-brand-600 uppercase tracking-widest">Step {step}</div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-50 rounded-2xl p-10 text-center space-y-4">
        <h2 className="text-2xl font-bold text-brand-900">Safe. Voluntary. Free.</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          FlightBuddy is a volunteer platform. Contact details are only shared after
          both parties confirm the match — your privacy is always protected.
        </p>
      </section>
    </div>
  );
}
