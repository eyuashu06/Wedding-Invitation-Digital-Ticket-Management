import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Mail, QrCode, Users, Calendar, Shield, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LandingPage() {
  const features = [
    { icon: Mail, title: "Digital Invitations", desc: "Send elegant, customizable invitation cards to every guest." },
    { icon: QrCode, title: "QR Ticket System", desc: "Each guest gets a unique, non-transferable QR code for entry." },
    { icon: Users, title: "Guest Management", desc: "Add guests individually or import via CSV. Categorize and search with ease." },
    { icon: Calendar, title: "RSVP Tracking", desc: "Real-time RSVP analytics — see who's coming, who's not, and who's unsure." },
    { icon: Shield, title: "Entrance Verification", desc: "Scan QR codes at the door. Prevent duplicates and maintain entry logs." },
    { icon: Sparkles, title: "Beautiful Templates", desc: "Choose from modern, traditional, and romantic invitation designs." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-gold-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <nav className="flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-600 text-white">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">WeddingPass</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
          <Link to="/signup"><Button size="sm">Get Started</Button></Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 py-16 lg:px-12 lg:py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-gold-200/30 blur-3xl dark:bg-gold-900/20" />
          <div className="absolute right-1/4 top-32 h-72 w-72 rounded-full bg-blush-200/30 blur-3xl dark:bg-blush-900/20" />
        </div>
        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300 bg-gold-50 px-4 py-1.5 text-sm font-medium text-gold-700 dark:border-gold-800 dark:bg-gold-900/30 dark:text-gold-300">
              <Sparkles className="h-3.5 w-3.5" /> Digital wedding invitations, reimagined
            </span>
            <h1 className="mt-6 font-serif text-5xl font-bold leading-tight text-stone-900 dark:text-stone-100 lg:text-6xl">
              Every guest,<br />
              <span className="bg-gradient-to-r from-gold-600 to-blush-500 bg-clip-text text-transparent">perfectly invited</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600 dark:text-stone-400">
              Create stunning digital invitation cards, generate unique QR tickets, track RSVPs in real time, and verify guests at the entrance — all in one elegant platform.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/signup"><Button size="lg">Start Creating <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/login"><Button variant="secondary" size="lg">Sign In</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-50 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">{f.title}</h3>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-gold-600 to-gold-800 px-8 py-12 text-center text-white shadow-xl lg:px-16">
          <h2 className="font-serif text-3xl font-bold lg:text-4xl">Ready to invite your guests?</h2>
          <p className="mt-4 text-gold-50">Join WeddingPass and create your first wedding event in minutes.</p>
          <Link to="/signup" className="mt-8 inline-block">
            <Button variant="secondary" size="lg" className="bg-white text-gold-700 hover:bg-gold-50">Create Your Wedding</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200 px-6 py-8 text-center text-sm text-stone-400 dark:border-stone-800 lg:px-12">
        <p>WeddingPass — Elegant digital wedding invitations & tickets.</p>
      </footer>
    </div>
  );
}
