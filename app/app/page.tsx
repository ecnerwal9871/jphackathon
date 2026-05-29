import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-16 space-y-8">
        <h1 className="text-4xl font-extrabold text-brand-900 leading-tight">
          Travel with Confidence.<br />Never Fly Alone.
        </h1>
        <p className="text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed">
          We help older adults travelling alone find a trusted volunteer on the same flight — for assistance, companionship, and peace of mind.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
          <div className="text-center">
            <Link
              href="/request"
              className="block w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold px-10 py-5 rounded-xl text-2xl shadow-lg transition"
            >
              ✈️ I Need Help Travelling
            </Link>
            <p className="text-base text-gray-700 mt-2">Travelling alone? Start here.</p>
          </div>
          <div className="text-center">
            <Link
              href="/volunteer"
              className="block w-full sm:w-auto bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 font-bold px-10 py-5 rounded-xl text-2xl shadow transition"
            >
              🤝 I Want to Volunteer
            </Link>
            <p className="text-base text-gray-700 mt-2">Flying the same route? Help a traveller.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center text-brand-900">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', icon: '📋', title: 'Tell Us Your Flight', desc: 'Share your route, travel date, airline, and language. It only takes a minute.' },
            { step: '2', icon: '🔍', title: 'We Find a Match', desc: 'Volunteers on the same flight offer to help. You choose who to connect with.' },
            { step: '3', icon: '📞', title: 'Connect Safely', desc: 'You confirm before any contact details are shared. You stay in control.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl p-8 shadow text-center space-y-3">
              <div className="text-5xl">{icon}</div>
              <div className="text-base font-bold text-brand-600 uppercase tracking-widest">Step {step}</div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-gray-700 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-50 rounded-2xl p-10 text-center space-y-4">
        <h2 className="text-2xl font-bold text-brand-900">Safe. Voluntary. Free.</h2>
        <p className="text-lg text-gray-800 max-w-2xl mx-auto leading-relaxed">
          FlightBuddy is a volunteer platform. Contact details are only shared after
          both parties confirm the match. You stay in control — nothing is shared until you agree.
        </p>
      </section>
    </div>
  );
}
