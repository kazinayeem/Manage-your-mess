export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
};

type LegalKey = "privacy" | "terms" | "refund" | "cookies";

const legalContent: Record<"en" | "bn", Record<LegalKey, LegalDocument>> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      updatedAt: "Last updated: June 2026",
      intro: [
        "MessFlow Pro is committed to protecting your privacy and handling your information responsibly.",
        "This policy explains what information we collect, how we use it, and the choices you have regarding your data.",
      ],
      sections: [
        {
          title: "Information We Collect",
          paragraphs: [
            "We collect account details such as your name, email address, phone number, and mess profile information when you register or contact us.",
            "We also store mess management data that you create inside the platform, including members, meals, expenses, deposits, bills, reports, and uploaded payment proofs.",
          ],
        },
        {
          title: "How We Use Information",
          paragraphs: [
            "We use your information to provide the service, secure accounts, generate reports, review subscription payments, and improve product performance.",
            "We may also send service-related messages such as login alerts, billing notices, announcements, and support responses.",
          ],
        },
        {
          title: "Data Security",
          paragraphs: [
            "We use industry-standard safeguards such as encrypted connections, access controls, audit logging, and server-side validation.",
            "Although no system can guarantee absolute security, we continuously work to protect your information against unauthorized access and misuse.",
          ],
        },
        {
          title: "Data Sharing",
          paragraphs: [
            "We do not sell your personal information. We may share limited data with trusted service providers only when needed to host, secure, or operate the platform.",
            "We may also disclose information when required by law or to protect the rights, safety, and integrity of our users and services.",
          ],
        },
        {
          title: "Your Choices",
          paragraphs: [
            "You may request account updates or contact us regarding your stored information.",
            "If you stop using the platform, some records may remain in backups, logs, or financial history where retention is required for security, accounting, or compliance reasons.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      updatedAt: "Last updated: June 2026",
      intro: [
        "By accessing or using MessFlow Pro, you agree to follow these terms.",
        "If you do not agree with these terms, please do not use the service.",
      ],
      sections: [
        {
          title: "Service Description",
          paragraphs: [
            "MessFlow Pro provides mess and hostel management software, including accounting, billing, subscription, analytics, reporting, and member management tools.",
            "Some features may vary based on your selected plan, trial status, and platform configuration.",
          ],
        },
        {
          title: "Account Responsibilities",
          paragraphs: [
            "You are responsible for protecting your login credentials and for all activity under your account.",
            "You must provide accurate information and must not use the platform for unlawful, fraudulent, abusive, or harmful activity.",
          ],
        },
        {
          title: "Subscriptions and Billing",
          paragraphs: [
            "Paid features are provided according to your active subscription plan and approved payment status.",
            "Trials, plan upgrades, renewals, suspensions, and expirations are controlled by platform billing rules and may affect access to premium features.",
          ],
        },
        {
          title: "Availability and Changes",
          paragraphs: [
            "We may improve, update, suspend, or discontinue parts of the service when needed for maintenance, security, or product changes.",
            "We try to give notice for major changes whenever practical, but some urgent changes may happen immediately.",
          ],
        },
        {
          title: "Limitation of Liability",
          paragraphs: [
            "To the fullest extent permitted by law, MessFlow Pro is provided on an as-available basis without guarantees of uninterrupted operation.",
            "We are not liable for indirect, incidental, or consequential losses arising from your use of the service.",
          ],
        },
      ],
    },
    refund: {
      title: "Refund Policy",
      updatedAt: "Last updated: June 2026",
      intro: [
        "This refund policy explains when subscription payments may be reviewed for refund.",
        "Because MessFlow Pro includes manual payment approval and plan activation, refunds are handled case by case.",
      ],
      sections: [
        {
          title: "Eligibility",
          paragraphs: [
            "You may request a refund if you were charged incorrectly, paid more than required, or experienced duplicate payment for the same subscription period.",
            "Refund requests should be submitted as soon as possible with your transaction ID, payment screenshot, plan name, and a short explanation.",
          ],
        },
        {
          title: "Non-Refundable Cases",
          paragraphs: [
            "Approved subscriptions that have already been activated and used are generally non-refundable unless required by law or approved by our billing team.",
            "We may reject refund requests for incomplete claims, abusive usage, or attempts to bypass plan restrictions after using premium features.",
          ],
        },
        {
          title: "Review Process",
          paragraphs: [
            "Our team reviews refund requests manually using payment history, audit logs, and subscription records.",
            "If approved, the refund may be processed through the original payment channel or another agreed method, depending on local payment limitations.",
          ],
        },
        {
          title: "Processing Time",
          paragraphs: [
            "Refund decisions may take a few business days depending on the complexity of verification.",
            "Actual receipt time depends on the payment provider, bank, or mobile financial service used for the original transaction.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookie Policy",
      updatedAt: "Last updated: June 2026",
      intro: [
        "This cookie policy explains how MessFlow Pro uses cookies and similar technologies.",
        "We use them to keep the platform secure, remember preferences, and improve user experience.",
      ],
      sections: [
        {
          title: "What Cookies We Use",
          paragraphs: [
            "We use essential cookies and session technologies to keep you signed in, remember locale and theme preferences, and maintain secure navigation.",
            "We may also use limited diagnostic or analytics tools to understand performance and improve the product.",
          ],
        },
        {
          title: "Why We Use Cookies",
          paragraphs: [
            "Cookies help us authenticate users, prevent misuse, keep settings consistent, and deliver a smoother experience across pages and devices.",
            "Without essential cookies, some parts of the service may not work correctly.",
          ],
        },
        {
          title: "Third-Party Services",
          paragraphs: [
            "Some third-party integrations may set their own cookies when required for security, payments, support, or embedded content.",
            "Those providers manage their cookies under their own policies.",
          ],
        },
        {
          title: "Managing Cookies",
          paragraphs: [
            "You can control cookies through your browser settings, including blocking or deleting stored cookies.",
            "Disabling essential cookies may affect login, language preference, and other core platform features.",
          ],
        },
      ],
    },
  },
  bn: {
    privacy: {
      title: "গোপনীয়তা নীতি",
      updatedAt: "সর্বশেষ হালনাগাদ: জুন ২০২৬",
      intro: [
        "MessFlow Pro আপনার গোপনীয়তা রক্ষা এবং তথ্য দায়িত্বশীলভাবে ব্যবহারে প্রতিশ্রুতিবদ্ধ।",
        "এই নীতিতে আমরা কী তথ্য সংগ্রহ করি, কীভাবে ব্যবহার করি এবং আপনার কী কী অধিকার আছে তা ব্যাখ্যা করা হয়েছে।",
      ],
      sections: [
        {
          title: "আমরা কী তথ্য সংগ্রহ করি",
          paragraphs: [
            "আপনি রেজিস্ট্রেশন বা যোগাযোগ করার সময় আমরা নাম, ইমেইল, ফোন নম্বর এবং মেস-সংক্রান্ত প্রোফাইল তথ্য সংগ্রহ করতে পারি।",
            "এছাড়াও প্ল্যাটফর্মে আপনি যে মেস ডেটা তৈরি করেন, যেমন সদস্য, মিল, খরচ, জমা, বিল, রিপোর্ট এবং পেমেন্ট স্ক্রিনশট, সেগুলো সংরক্ষিত হতে পারে।",
          ],
        },
        {
          title: "তথ্য কীভাবে ব্যবহার করি",
          paragraphs: [
            "আমরা সেবা প্রদান, অ্যাকাউন্ট সুরক্ষা, রিপোর্ট তৈরি, সাবস্ক্রিপশন পেমেন্ট যাচাই এবং পণ্যের মানোন্নয়নে এই তথ্য ব্যবহার করি।",
            "লগইন সতর্কতা, বিলিং নোটিশ, ঘোষণা এবং সাপোর্ট বার্তার মতো সার্ভিস-সংক্রান্ত নোটিফিকেশনও পাঠানো হতে পারে।",
          ],
        },
        {
          title: "ডেটা নিরাপত্তা",
          paragraphs: [
            "আমরা এনক্রিপ্টেড সংযোগ, এক্সেস কন্ট্রোল, অডিট লগিং এবং সার্ভার-সাইড ভ্যালিডেশনের মতো মানসম্মত নিরাপত্তা ব্যবস্থা ব্যবহার করি।",
            "কোনো সিস্টেম শতভাগ নিরাপত্তা নিশ্চিত করতে না পারলেও, অননুমোদিত প্রবেশ ও অপব্যবহার প্রতিরোধে আমরা ধারাবাহিকভাবে কাজ করি।",
          ],
        },
        {
          title: "ডেটা শেয়ারিং",
          paragraphs: [
            "আমরা আপনার ব্যক্তিগত তথ্য বিক্রি করি না। শুধুমাত্র হোস্টিং, নিরাপত্তা বা সেবা পরিচালনার প্রয়োজনে বিশ্বস্ত সেবা প্রদানকারীদের সাথে সীমিত তথ্য শেয়ার হতে পারে।",
            "আইনগত প্রয়োজন, ব্যবহারকারীর নিরাপত্তা বা সেবার অখণ্ডতা রক্ষার ক্ষেত্রেও তথ্য প্রকাশ করা হতে পারে।",
          ],
        },
        {
          title: "আপনার নিয়ন্ত্রণ",
          paragraphs: [
            "আপনি আপনার অ্যাকাউন্ট তথ্য হালনাগাদ বা সংরক্ষিত ডেটা সম্পর্কে জানতে আমাদের সাথে যোগাযোগ করতে পারেন।",
            "আপনি সেবা ব্যবহার বন্ধ করলেও নিরাপত্তা, হিসাবরক্ষণ বা কমপ্লায়েন্সের কারণে কিছু তথ্য ব্যাকআপ, লগ বা আর্থিক ইতিহাসে সংরক্ষিত থাকতে পারে।",
          ],
        },
      ],
    },
    terms: {
      title: "সেবার শর্তাবলী",
      updatedAt: "সর্বশেষ হালনাগাদ: জুন ২০২৬",
      intro: [
        "MessFlow Pro ব্যবহার করার মাধ্যমে আপনি এই শর্তাবলী মেনে নিতে সম্মত হচ্ছেন।",
        "যদি এই শর্তাবলীর সাথে একমত না হন, তবে অনুগ্রহ করে সেবা ব্যবহার করবেন না।",
      ],
      sections: [
        {
          title: "সেবার বিবরণ",
          paragraphs: [
            "MessFlow Pro মেস ও হোস্টেল ব্যবস্থাপনার জন্য সফটওয়্যার সেবা প্রদান করে, যার মধ্যে হিসাব, বিলিং, সাবস্ক্রিপশন, অ্যানালিটিক্স, রিপোর্টিং এবং সদস্য ব্যবস্থাপনা অন্তর্ভুক্ত।",
            "কিছু ফিচার আপনার প্ল্যান, ট্রায়াল অবস্থা এবং প্ল্যাটফর্ম কনফিগারেশনের ওপর নির্ভর করে ভিন্ন হতে পারে।",
          ],
        },
        {
          title: "অ্যাকাউন্টের দায়িত্ব",
          paragraphs: [
            "আপনার লগইন তথ্য নিরাপদ রাখা এবং আপনার অ্যাকাউন্টের সব কার্যকলাপের দায়িত্ব আপনার।",
            "আপনাকে সঠিক তথ্য দিতে হবে এবং বেআইনি, প্রতারণামূলক, অপব্যবহারমূলক বা ক্ষতিকর কাজে প্ল্যাটফর্ম ব্যবহার করা যাবে না।",
          ],
        },
        {
          title: "সাবস্ক্রিপশন ও বিলিং",
          paragraphs: [
            "পেইড ফিচার কেবলমাত্র আপনার সক্রিয় সাবস্ক্রিপশন প্ল্যান এবং অনুমোদিত পেমেন্ট স্ট্যাটাস অনুযায়ী দেওয়া হয়।",
            "ট্রায়াল, প্ল্যান আপগ্রেড, রিনিউয়াল, সাসপেনশন এবং এক্সপায়ারি প্ল্যাটফর্মের বিলিং নীতিমালা অনুযায়ী নিয়ন্ত্রিত হয় এবং এগুলো প্রিমিয়াম ফিচার ব্যবহারে প্রভাব ফেলতে পারে।",
          ],
        },
        {
          title: "সেবার প্রাপ্যতা ও পরিবর্তন",
          paragraphs: [
            "রক্ষণাবেক্ষণ, নিরাপত্তা বা পণ্য উন্নয়নের প্রয়োজনে আমরা সেবার কিছু অংশ পরিবর্তন, স্থগিত বা বন্ধ করতে পারি।",
            "যেখানে সম্ভব, বড় পরিবর্তনের আগে আমরা নোটিশ দেওয়ার চেষ্টা করি; তবে জরুরি ক্ষেত্রে তাৎক্ষণিক পরিবর্তন হতে পারে।",
          ],
        },
        {
          title: "দায়সীমা",
          paragraphs: [
            "প্রযোজ্য আইনের সীমার মধ্যে MessFlow Pro as-available ভিত্তিতে প্রদান করা হয় এবং নিরবচ্ছিন্ন সেবা নিশ্চিত করা হয় না।",
            "সেবা ব্যবহারের ফলে উদ্ভূত পরোক্ষ, আকস্মিক বা ফলস্বরূপ ক্ষতির জন্য আমরা দায়ী থাকব না।",
          ],
        },
      ],
    },
    refund: {
      title: "রিফান্ড নীতি",
      updatedAt: "সর্বশেষ হালনাগাদ: জুন ২০২৬",
      intro: [
        "এই রিফান্ড নীতিতে ব্যাখ্যা করা হয়েছে কোন পরিস্থিতিতে সাবস্ক্রিপশন পেমেন্ট ফেরত বিবেচনা করা হতে পারে।",
        "MessFlow Pro-তে ম্যানুয়াল পেমেন্ট অনুমোদন ও প্ল্যান অ্যাক্টিভেশন থাকায় রিফান্ড কেসভিত্তিকভাবে পর্যালোচনা করা হয়।",
      ],
      sections: [
        {
          title: "রিফান্ডের যোগ্যতা",
          paragraphs: [
            "ভুল চার্জ, অতিরিক্ত পেমেন্ট বা একই সাবস্ক্রিপশন সময়ের জন্য ডুপ্লিকেট পেমেন্ট হলে আপনি রিফান্ড অনুরোধ করতে পারেন।",
            "রিফান্ড অনুরোধের সাথে ট্রানজ্যাকশন আইডি, পেমেন্ট স্ক্রিনশট, প্ল্যানের নাম এবং সংক্ষিপ্ত ব্যাখ্যা জমা দিতে হবে।",
          ],
        },
        {
          title: "যে ক্ষেত্রে রিফান্ড প্রযোজ্য নয়",
          paragraphs: [
            "যে সাবস্ক্রিপশন ইতোমধ্যে অনুমোদিত, সক্রিয় এবং ব্যবহার করা হয়েছে, তা সাধারণত আইনগত বাধ্যবাধকতা বা বিশেষ অনুমোদন ছাড়া ফেরতযোগ্য নয়।",
            "অসম্পূর্ণ দাবি, অপব্যবহারমূলক ব্যবহার বা প্রিমিয়াম ফিচার ব্যবহারের পর সীমাবদ্ধতা এড়াতে করা অনুরোধ প্রত্যাখ্যান করা হতে পারে।",
          ],
        },
        {
          title: "পর্যালোচনা প্রক্রিয়া",
          paragraphs: [
            "আমাদের টিম পেমেন্ট হিস্ট্রি, অডিট লগ এবং সাবস্ক্রিপশন রেকর্ড দেখে রিফান্ড অনুরোধ ম্যানুয়ালি যাচাই করে।",
            "অনুমোদিত হলে মূল পেমেন্ট চ্যানেল বা স্থানীয় পেমেন্ট ব্যবস্থার সীমাবদ্ধতা অনুযায়ী অন্য সম্মত উপায়ে রিফান্ড পাঠানো হতে পারে।",
          ],
        },
        {
          title: "প্রসেসিং সময়",
          paragraphs: [
            "যাচাইয়ের জটিলতা অনুযায়ী সিদ্ধান্ত নিতে কয়েক কর্মদিবস সময় লাগতে পারে।",
            "রিফান্ড পাওয়ার প্রকৃত সময় আপনার ব্যাংক, MFS বা ব্যবহৃত পেমেন্ট সেবার ওপর নির্ভর করবে।",
          ],
        },
      ],
    },
    cookies: {
      title: "কুকি নীতি",
      updatedAt: "সর্বশেষ হালনাগাদ: জুন ২০২৬",
      intro: [
        "এই কুকি নীতিতে ব্যাখ্যা করা হয়েছে MessFlow Pro কীভাবে কুকি এবং অনুরূপ প্রযুক্তি ব্যবহার করে।",
        "আমরা নিরাপত্তা, পছন্দ সংরক্ষণ এবং ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে এগুলো ব্যবহার করি।",
      ],
      sections: [
        {
          title: "কোন কুকি ব্যবহার করি",
          paragraphs: [
            "আমরা প্রয়োজনীয় কুকি ও সেশন প্রযুক্তি ব্যবহার করি যাতে আপনি লগইন অবস্থায় থাকতে পারেন, ভাষা ও থিমের পছন্দ মনে রাখা যায় এবং নিরাপদ নেভিগেশন নিশ্চিত হয়।",
            "পারফরম্যান্স বোঝা ও পণ্য উন্নয়নের জন্য সীমিত ডায়াগনস্টিক বা অ্যানালিটিক্স টুলও ব্যবহার হতে পারে।",
          ],
        },
        {
          title: "কেন কুকি ব্যবহার করি",
          paragraphs: [
            "কুকি ব্যবহারকারীর পরিচয় যাচাই, অপব্যবহার প্রতিরোধ, সেটিংস সংরক্ষণ এবং বিভিন্ন পেজ/ডিভাইসে ভালো অভিজ্ঞতা দিতে সাহায্য করে।",
            "প্রয়োজনীয় কুকি ছাড়া সেবার কিছু অংশ সঠিকভাবে কাজ নাও করতে পারে।",
          ],
        },
        {
          title: "থার্ড-পার্টি সেবা",
          paragraphs: [
            "নিরাপত্তা, পেমেন্ট, সাপোর্ট বা এমবেডেড কনটেন্টের প্রয়োজনে কিছু তৃতীয় পক্ষের সেবা নিজেদের কুকি ব্যবহার করতে পারে।",
            "সেসব কুকির ব্যবস্থাপনা সংশ্লিষ্ট সেবা প্রদানকারীর নিজস্ব নীতিমালার অধীন।",
          ],
        },
        {
          title: "কুকি নিয়ন্ত্রণ",
          paragraphs: [
            "আপনি ব্রাউজার সেটিংস থেকে কুকি ব্লক, মুছে ফেলা বা নিয়ন্ত্রণ করতে পারেন।",
            "তবে প্রয়োজনীয় কুকি বন্ধ করলে লগইন, ভাষা পছন্দ এবং কিছু গুরুত্বপূর্ণ ফিচার প্রভাবিত হতে পারে।",
          ],
        },
      ],
    },
  },
};

export function getLegalDocument(locale: string, key: LegalKey): LegalDocument {
  const normalizedLocale = locale === "bn" ? "bn" : "en";
  return legalContent[normalizedLocale][key];
}
