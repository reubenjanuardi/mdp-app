const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Menara Digdaya Perkasa",
  subtitle: "Sistem Terintegrasi",
  company: "PT Menara Digdaya Perkasa",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  copyright: `© ${currentYear} PT Menara Digdaya Perkasa`,
  meta: {
    title: "Sistem Informasi Terintegrasi · PT Menara Digdaya Perkasa",
    description: "Pesanan, tagihan, pembayaran, status produksi, dan pengiriman dalam satu tempat.",
  },
};
