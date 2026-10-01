-- AlterTable: every existing logo is a client logo.
ALTER TABLE "BrandLogo" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'client';

-- Partners shown on the old website's home page (images ship with the site
-- under /images/partner/). Managed afterwards under Admin -> Logos -> Partners.
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/lenovo.png', 'Lenovo', 'partner', 0);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/varonis.png', 'Varonis', 'partner', 1);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/TCIL.svg', 'TCIL', 'partner', 2);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/ascent.png', 'Ascent', 'partner', 3);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/htc-global.png', 'HTC Global', 'partner', 4);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/audix.png', 'Audix', 'partner', 5);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/ispectra.png', 'iSpectra', 'partner', 6);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/noventq.png', 'Noventiq', 'partner', 7);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/quadraft.png', 'Quadraft', 'partner', 8);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/rapidoerp.png', 'RapidoERP', 'partner', 9);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/techighnet.png', 'Techighnet', 'partner', 10);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/trellix.png', 'Trellix', 'partner', 11);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/matters.png', 'Matters', 'partner', 12);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/lightbeam.png', 'Lightbeam', 'partner', 13);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/vserv.png', 'Vserv', 'partner', 14);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/brennan.png', 'Brennan', 'partner', 15);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/netscale.png', 'Netscale', 'partner', 16);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/concectro.png', 'Concectro', 'partner', 17);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/Hitachi_consulating.png', 'Hitachi Consulting', 'partner', 18);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/seamless.png', 'Seamless Infotech', 'partner', 19);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/starlight.png', 'Starlight Data Solutions', 'partner', 20);
INSERT INTO "BrandLogo" ("imageUrl", "alt", "kind", "sortOrder") VALUES ('/images/partner/VDA.png', 'VDA', 'partner', 21);
