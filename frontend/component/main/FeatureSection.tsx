import type { LandingDictionary } from "@/lib/i18n";

const styles = [
  {
    gradient: "from-sky-500/20 to-sky-600/5",
    border: "border-sky-500/20",
  },
  {
    gradient: "from-blue-600/20 to-blue-700/5",
    border: "border-blue-600/20",
  },
  {
    gradient: "from-sky-400/20 to-sky-500/5",
    border: "border-sky-400/20",
  },
  {
    gradient: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
  },
  {
    gradient: "from-sky-600/20 to-sky-700/5",
    border: "border-sky-600/20",
  },
  {
    gradient: "from-blue-700/20 to-blue-800/5",
    border: "border-blue-700/20",
  },
];

export default function FeatureSection({
  dictionary,
}: {
  dictionary: LandingDictionary["features"];
}) {
  return (
    <section id="features" className="py-32 bg-[#050d1a] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(800px,90vw)] h-[min(400px,50vw)] bg-sky-500/5 rounded-full blur-[120px]" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs mb-4">
            {dictionary.eyebrow}
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            {dictionary.titlePrefix}
            <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              {" "}
              {dictionary.titleAccent}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {dictionary.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dictionary.items.map((feature, i) => (
            <div
              key={feature.title}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${styles[i].gradient} border ${styles[i].border} hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-bold text-sky-300 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
