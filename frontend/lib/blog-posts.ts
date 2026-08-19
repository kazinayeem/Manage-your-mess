export type BlogPost = {
  slug: string;
  date: string;
  image: string;
  readTime: string;
  title: {
    en: string;
    bn: string;
  };
  excerpt: {
    en: string;
    bn: string;
  };
  category: {
    en: string;
    bn: string;
  };
  sections: Array<{
    heading: {
      en: string;
      bn: string;
    };
    paragraphs: {
      en: string[];
      bn: string[];
    };
  }>;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "meal-rate-calculation-guide",
    date: "2026-01-15",
    image: "/1.png",
    readTime: "4 min read",
    title: {
      en: "How Meal Rate Calculation Works in a Mess",
      bn: "মেসে মিল রেট কিভাবে হিসাব করা হয়",
    },
    excerpt: {
      en: "Learn the simple formula behind meal rate, how deposits and expenses affect it, and why accurate daily entry matters.",
      bn: "মিল রেটের সহজ ফর্মুলা, জমা ও খরচের প্রভাব, এবং প্রতিদিন সঠিক এন্ট্রি কেন জরুরি তা জানুন।",
    },
    category: {
      en: "Meals",
      bn: "মিল",
    },
    sections: [
      {
        heading: { en: "What is meal rate?", bn: "মিল রেট কী?" },
        paragraphs: {
          en: [
            "Meal rate is the average cost of one meal during a selected month. It helps every member understand how much each meal actually costs based on real mess expenses.",
            "In most messes, the monthly grocery and meal-related cost is divided by the total number of meals consumed. This keeps the calculation fair for both heavy and light eaters.",
          ],
          bn: [
            "মিল রেট হলো নির্দিষ্ট মাসে একটি মিলের গড় খরচ। এতে প্রতিটি সদস্য বুঝতে পারে বাস্তব খরচ অনুযায়ী একেকটি মিলের প্রকৃত মূল্য কত হয়েছে।",
            "সাধারণত মেসের মাসিক বাজার ও মিল-সংক্রান্ত খরচ মোট মিল সংখ্যায় ভাগ করা হয়। এতে বেশি মিল খাওয়া এবং কম মিল খাওয়া সদস্যদের জন্য হিসাব ন্যায্য থাকে।",
          ],
        },
      },
      {
        heading: { en: "Why accurate entries matter", bn: "সঠিক এন্ট্রি কেন গুরুত্বপূর্ণ" },
        paragraphs: {
          en: [
            "If meal counts are entered late or incorrectly, the final rate becomes misleading. A small daily error can create a large monthly difference.",
            "Using a digital system keeps breakfast, lunch, and dinner records organized and reduces arguments at month end.",
          ],
          bn: [
            "মিল সংখ্যা দেরিতে বা ভুলভাবে এন্ট্রি হলে চূড়ান্ত মিল রেট বিভ্রান্তিকর হয়ে যায়। দৈনিক ছোট ভুলও মাস শেষে বড় পার্থক্য তৈরি করতে পারে।",
            "ডিজিটাল সিস্টেম ব্যবহার করলে সকালের নাশতা, দুপুর ও রাতের খাবারের রেকর্ড গুছানো থাকে এবং মাস শেষে তর্ক কমে যায়।",
          ],
        },
      },
    ],
  },
  {
    slug: "managing-deposits-bkash-nagad",
    date: "2026-02-01",
    image: "/2.png",
    readTime: "5 min read",
    title: {
      en: "Managing Deposits with bKash and Nagad",
      bn: "bKash ও Nagad দিয়ে জমা ব্যবস্থাপনা",
    },
    excerpt: {
      en: "Track member deposits faster, reduce missing transactions, and keep a clean approval workflow for digital payments.",
      bn: "সদস্যদের জমা দ্রুত ট্র্যাক করুন, হারিয়ে যাওয়া ট্রানজ্যাকশন কমান, এবং ডিজিটাল পেমেন্টের জন্য পরিষ্কার approval workflow রাখুন।",
    },
    category: {
      en: "Deposits",
      bn: "জমা",
    },
    sections: [
      {
        heading: { en: "Why digital deposits help", bn: "ডিজিটাল জমা কেন ভালো" },
        paragraphs: {
          en: [
            "Mobile banking reduces cash handling problems and helps members pay from anywhere. For managers, this means faster verification and cleaner records.",
            "With transaction IDs and screenshots, every payment can be traced later if any dispute happens.",
          ],
          bn: [
            "মোবাইল ব্যাংকিং নগদ অর্থ ব্যবস্থাপনার ঝামেলা কমায় এবং সদস্যরা যেকোনো জায়গা থেকে পেমেন্ট করতে পারে। ম্যানেজারের জন্য এতে verification দ্রুত হয় এবং রেকর্ড পরিষ্কার থাকে।",
            "Transaction ID এবং screenshot থাকলে পরে কোনো বিরোধ হলে প্রতিটি পেমেন্ট সহজে ট্রেস করা যায়।",
          ],
        },
      },
      {
        heading: { en: "Approval flow matters", bn: "Approval flow কেন জরুরি" },
        paragraphs: {
          en: [
            "A proper approval step ensures that pending payments do not instantly change balances before review. This is especially useful when users mistype transaction IDs or upload the wrong screenshot.",
            "Once approved, the system can safely unlock the related subscription or update the mess account without manual recalculation.",
          ],
          bn: [
            "সঠিক approval ধাপ থাকলে pending payment review ছাড়া সাথে সাথে balance বদলে যায় না। ব্যবহারকারী ভুল transaction ID দিলে বা ভুল screenshot দিলে এটি বিশেষভাবে কাজে লাগে।",
            "Approve হয়ে গেলে সিস্টেম নিরাপদভাবে সংশ্লিষ্ট subscription unlock করতে পারে বা manual recalculation ছাড়াই mess account update করতে পারে।",
          ],
        },
      },
    ],
  },
  {
    slug: "room-management-best-practices",
    date: "2026-03-10",
    image: "/3.png",
    readTime: "4 min read",
    title: {
      en: "Room Management Best Practices for Hostels and Messes",
      bn: "হোস্টেল ও মেসের জন্য রুম ম্যানেজমেন্টের সেরা পদ্ধতি",
    },
    excerpt: {
      en: "Organize rooms, beds, occupancy, and movement history so managers always know who is staying where.",
      bn: "রুম, বেড, occupancy, এবং movement history এমনভাবে সাজান যাতে ম্যানেজার সবসময় জানতে পারে কে কোথায় থাকছে।",
    },
    category: {
      en: "Rooms",
      bn: "রুম",
    },
    sections: [
      {
        heading: { en: "Keep occupancy visible", bn: "Occupancy দৃশ্যমান রাখুন" },
        paragraphs: {
          en: [
            "A room system works best when occupancy is visible at a glance. Managers should immediately know which room is full, partially occupied, or vacant.",
            "This improves planning when new members join and helps avoid double allocation mistakes.",
          ],
          bn: [
            "একটি ভালো room system তখনই কার্যকর হয় যখন occupancy এক নজরে দেখা যায়। ম্যানেজার দ্রুত বুঝতে পারে কোন রুম full, কোনটি partially occupied, আর কোনটি vacant।",
            "নতুন সদস্য যোগ হলে planning সহজ হয় এবং একই bed দুইবার allocate করার ভুল কমে যায়।",
          ],
        },
      },
      {
        heading: { en: "Maintain movement history", bn: "Movement history সংরক্ষণ করুন" },
        paragraphs: {
          en: [
            "When members shift rooms frequently, a movement history becomes important for accountability. It helps with rent logic, security, and dispute resolution.",
            "Historical room data is also useful for owners who want an audit trail of who stayed where in a given period.",
          ],
          bn: [
            "সদস্যরা ঘন ঘন রুম বদলালে movement history খুব গুরুত্বপূর্ণ হয়ে যায়। এটি accountability, rent logic, security, এবং dispute resolution-এ সাহায্য করে।",
            "নির্দিষ্ট সময়ে কে কোন রুমে ছিল তার audit trail রাখতে historical room data মালিকদের জন্যও উপকারী।",
          ],
        },
      },
    ],
  },
  {
    slug: "monthly-bazaar-cost-control",
    date: "2026-04-05",
    image: "/4.png",
    readTime: "5 min read",
    title: {
      en: "Monthly Bazaar Cost Control Without Confusion",
      bn: "ঝামেলা ছাড়া মাসিক বাজার খরচ নিয়ন্ত্রণ",
    },
    excerpt: {
      en: "Use assigned tasks, receipt uploads, and approval checkpoints to control bazaar spending across the month.",
      bn: "Assigned task, receipt upload, এবং approval checkpoint ব্যবহার করে পুরো মাসের বাজার খরচ নিয়ন্ত্রণ করুন।",
    },
    category: {
      en: "Bazaar",
      bn: "বাজার",
    },
    sections: [
      {
        heading: { en: "Assign one owner per task", bn: "প্রতি task-এ একজন দায়িত্বশীল রাখুন" },
        paragraphs: {
          en: [
            "Confusion starts when multiple people buy the same items without coordination. Assigning a single member per bazaar task creates ownership and reduces duplicate spending.",
            "A deadline and expected budget make each assignment easier to monitor.",
          ],
          bn: [
            "সমন্বয় ছাড়া একাধিক ব্যক্তি একই জিনিস কিনলে বিভ্রান্তি শুরু হয়। প্রতিটি bazaar task-এ একজন সদস্য assign করলে ownership তৈরি হয় এবং duplicate spending কমে।",
            "Deadline এবং expected budget থাকলে প্রতিটি assignment monitor করা আরও সহজ হয়।",
          ],
        },
      },
      {
        heading: { en: "Approve after verification", bn: "যাচাইয়ের পর approve করুন" },
        paragraphs: {
          en: [
            "Receipt images and purchased item lists should be checked before final approval. This keeps the spending record trustworthy.",
            "A simple approval step also helps spot unusual pricing, missing items, or budget overruns early.",
          ],
          bn: [
            "Receipt image এবং কেনা items list final approval-এর আগে যাচাই করা উচিত। এতে spending record বেশি বিশ্বাসযোগ্য থাকে।",
            "সহজ approval ধাপ unusual pricing, missing item, বা budget overrun দ্রুত ধরতে সাহায্য করে।",
          ],
        },
      },
    ],
  },
  {
    slug: "utility-bill-tracking-for-shared-living",
    date: "2026-05-02",
    image: "/5.png",
    readTime: "4 min read",
    title: {
      en: "Utility Bill Tracking for Shared Living",
      bn: "Shared living-এর জন্য utility bill tracking",
    },
    excerpt: {
      en: "Track rent, electricity, water, gas, and internet in one place so monthly closing becomes faster and more transparent.",
      bn: "ভাড়া, বিদ্যুৎ, পানি, গ্যাস, এবং ইন্টারনেট এক জায়গায় ট্র্যাক করুন যাতে মাসিক closing দ্রুত ও স্বচ্ছ হয়।",
    },
    category: {
      en: "Bills",
      bn: "বিল",
    },
    sections: [
      {
        heading: { en: "Centralize recurring bills", bn: "Recurring bill এক জায়গায় রাখুন" },
        paragraphs: {
          en: [
            "Utility payments often arrive from different people at different times. A centralized record prevents hidden dues and forgotten bills.",
            "Managers can compare current and previous months to understand seasonal spending changes.",
          ],
          bn: [
            "Utility payment অনেক সময় ভিন্ন ভিন্ন মানুষের কাছ থেকে ভিন্ন সময়ে আসে। এক জায়গায় record থাকলে hidden due বা ভুলে যাওয়া bill কমে যায়।",
            "ম্যানেজার current month এবং previous month compare করে seasonal spending change বুঝতে পারে।",
          ],
        },
      },
      {
        heading: { en: "Why shared visibility matters", bn: "Shared visibility কেন দরকার" },
        paragraphs: {
          en: [
            "When members can see bill totals clearly, month-end trust improves. It also reduces the need for repeated explanations in group chats.",
            "Transparent utility tracking supports cleaner settlement and fewer conflicts.",
          ],
          bn: [
            "সদস্যরা bill total পরিষ্কারভাবে দেখতে পারলে মাস শেষে trust বাড়ে। group chat-এ বারবার explanation দেওয়ার দরকারও কমে যায়।",
            "স্বচ্ছ utility tracking settlement সহজ করে এবং conflict কমায়।",
          ],
        },
      },
    ],
  },
  {
    slug: "why-mess-analytics-matters",
    date: "2026-06-12",
    image: "/6.png",
    readTime: "5 min read",
    title: {
      en: "Why Analytics Matters for Modern Mess Management",
      bn: "আধুনিক মেস ব্যবস্থাপনায় analytics কেন গুরুত্বপূর্ণ",
    },
    excerpt: {
      en: "Real-time charts help managers understand trends, spot due risks early, and make better month-to-month decisions.",
      bn: "Real-time chart ম্যানেজারকে trend বুঝতে, due risk আগে ধরতে, এবং মাসভিত্তিক ভালো সিদ্ধান্ত নিতে সাহায্য করে।",
    },
    category: {
      en: "Analytics",
      bn: "অ্যানালিটিক্স",
    },
    sections: [
      {
        heading: { en: "Move beyond guesswork", bn: "অনুমানের বাইরে যান" },
        paragraphs: {
          en: [
            "Without analytics, many managers rely on memory or scattered spreadsheets. That makes it hard to detect unusual expense spikes or delayed deposits.",
            "Simple charts for expenses, deposits, meals, dues, and bazaar costs turn raw data into clear decisions.",
          ],
          bn: [
            "Analytics ছাড়া অনেক ম্যানেজার memory বা ছড়ানো spreadsheet-এর উপর নির্ভর করে। এতে unusual expense spike বা delayed deposit ধরা কঠিন হয়।",
            "Expense, deposit, meal, due, এবং bazaar cost-এর simple chart raw data-কে clear decision-এ পরিণত করে।",
          ],
        },
      },
      {
        heading: { en: "Better planning every month", bn: "প্রতি মাসে ভালো planning" },
        paragraphs: {
          en: [
            "Trend visibility helps predict high-cost periods and plan deposits more realistically. It also supports better communication with members.",
            "Over time, analytics creates a healthier financial culture inside the mess.",
          ],
          bn: [
            "Trend visibility থাকলে high-cost period আগে থেকে বোঝা যায় এবং জমার planning আরও বাস্তবসম্মত করা যায়। এতে সদস্যদের সাথে communication-ও ভালো হয়।",
            "সময়ের সাথে analytics মেসের ভিতরে একটি healthier financial culture তৈরি করে।",
          ],
        },
      },
    ],
  },
];

export function getBlogPosts(locale: "en" | "bn") {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
    date: post.date,
    image: post.image,
    readTime: post.readTime,
    title: post.title[locale],
    excerpt: post.excerpt[locale],
    category: post.category[locale],
    sections: post.sections.map((section) => ({
      heading: section.heading[locale],
      paragraphs: section.paragraphs[locale],
    })),
  }));
}

export function getBlogPostBySlug(slug: string, locale: "en" | "bn") {
  const post = BLOG_POSTS.find((item) => item.slug === slug);
  if (!post) return null;

  return {
    slug: post.slug,
    date: post.date,
    image: post.image,
    readTime: post.readTime,
    title: post.title[locale],
    excerpt: post.excerpt[locale],
    category: post.category[locale],
    sections: post.sections.map((section) => ({
      heading: section.heading[locale],
      paragraphs: section.paragraphs[locale],
    })),
  };
}
