import Link from 'next/link';
import {Facebook, Instagram, Linkedin, CreditCard, ShieldCheck} from 'lucide-react';

const countyList = [
  'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kerry', 'Mayo', 'Wexford',
  'Meath', 'Kildare', 'Wicklow', 'Clare', 'Donegal', 'Kilkenny', 'Laois', 'Offaly'
];

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <h3 className="font-[Poppins] text-2xl font-bold text-[#1F2937]">WorkMate</h3>
            <p className="mt-3 max-w-sm text-sm text-[#4B5563]">Ireland-focused service marketplace built for trust, safety and fast matching.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="font-semibold text-[#1F2937]">Services</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#4B5563]">
                <li><Link href="/search">Cleaning</Link></li>
                <li><Link href="/search">Electrical</Link></li>
                <li><Link href="/search">Plumbing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1F2937]">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#4B5563]">
                <li><Link href="/about">About us</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1F2937]">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#4B5563]">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1F2937]">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#4B5563]">
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/cookies">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-[#1F2937]">Counties</h4>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#4B5563] sm:grid-cols-4 lg:grid-cols-8">
            {countyList.map((county) => (
              <span key={county}>{county}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#E5E7EB] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1"><CreditCard className="h-3.5 w-3.5" /> Visa</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1">Mastercard</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1"><ShieldCheck className="h-3.5 w-3.5" /> Stripe</span>
          </div>
          <div className="flex items-center gap-3 text-[#4B5563]">
            {[Facebook, Instagram, Linkedin].map((Icon, index) => (
              <Link
                key={index}
                href="/"
                title="Coming soon"
                aria-label="Social link coming soon"
                className="rounded-full border border-[#E5E7EB] p-2 transition hover:border-[#00B894] hover:text-[#00B894]"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#6B7280]">© {new Date().getFullYear()} WorkMate. All rights reserved.</p>
      </div>
    </footer>
  );
}
