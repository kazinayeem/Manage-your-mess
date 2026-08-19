import 'package:flutter/material.dart';

class AppL10n {
  final Locale locale;

  AppL10n(this.locale);

  static AppL10n of(BuildContext context) {
    return Localizations.of<AppL10n>(context, AppL10n) ?? AppL10n(const Locale('bn'));
  }

  static const _localizedValues = <String, Map<String, String>>{
    'bn': {
      'app_name': 'বর্ণমেস ম্যানেজার',
      'good_morning': 'শুভ সকাল',
      'good_afternoon': 'শুভ অপরাহ্ন',
      'good_evening': 'শুভ সন্ধ্যা',
      'login': 'লগইন করুন',
      'register': 'রেজিস্টার করুন',
      'email': 'ইমেইল এড্রেস',
      'password': 'পাসওয়ার্ড',
      'name': 'আপনার নাম',
      'phone': 'ফোন নম্বর',
      'forgot_password': 'পাসওয়ার্ড ভুলে গেছেন?',
      'dont_have_account': 'অ্যাকাউন্ট নেই? সাইন আপ করুন',
      'already_have_account': 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন',
      'home': 'হোম',
      'meals': 'মিল',
      'expenses': 'খরচ',
      'deposits': 'জমা',
      'bazaar': 'বাজার',
      'more': 'আরও',
      'meal_rate': 'মিল রেট',
      'my_deposit': 'আমার জমা',
      'my_due': 'আমার বকেয়া',
      'monthly_expense': 'মাসিক খরচ',
      'quick_actions': 'দ্রুত অ্যাকশন',
      'add_meal': '+ মিল যোগ করুন',
      'add_expense': '+ খরচ যোগ করুন',
      'add_deposit': '+ জমা দিন',
      'add_bazaar': '+ বাজার তালিকা',
      'recent_activity': 'সাম্প্রতিক কার্যক্রম',
      'today_meals': 'আজকের মিল',
      'breakfast': 'সকালের নাস্তা',
      'lunch': 'দুপুরের খাবার',
      'dinner': 'রাতের খাবার',
      'total': 'মোট',
      'submit': 'জমা দিন',
      'cancel': 'বাতিল',
      'save': 'সংরক্ষণ করুন',
      'logout': 'লগআউট',
      'language': 'ভাষা',
      'theme': 'থিম',
      'members': 'সদস্যবৃন্দ',
      'my_mess': 'আমার মেস',
      'analytics': 'অ্যানালিটিক্স',
      'notifications': 'নোটিফিকেশন',
      'profile': 'প্রোফাইল',
      'settings': 'সেটিংস',
      'invite_code': 'ইনভাইট কোড',
      'copy_code': 'কোড কপি করুন',
      'join_mess': 'মেসে যোগ দিন',
      'create_mess': 'নতুন মেস খুলুন',
      'offline_msg': 'আপনি অফলাইনে আছেন। ইন্টারনেট সংযোগ পরীক্ষা করুন।',
      'amount': 'টাকা পরিমাণ',
      'category': 'ক্যাটাগরি',
      'date': 'তারিখ',
      'description': 'বিবরণ',
      'method': 'পেমেন্ট মাধ্যম',
      'bKash': 'বিকাশ',
      'Nagad': 'নগদ',
      'Rocket': 'রকেট',
      'Cash': 'ক্যাশ',
    },
    'en': {
      'app_name': 'BornoMess Manager',
      'good_morning': 'Good Morning',
      'good_afternoon': 'Good Afternoon',
      'good_evening': 'Good Evening',
      'login': 'Log In',
      'register': 'Register',
      'email': 'Email Address',
      'password': 'Password',
      'name': 'Full Name',
      'phone': 'Phone Number',
      'forgot_password': 'Forgot Password?',
      'dont_have_account': "Don't have an account? Sign Up",
      'already_have_account': 'Already have an account? Log In',
      'home': 'Home',
      'meals': 'Meals',
      'expenses': 'Expenses',
      'deposits': 'Deposits',
      'bazaar': 'Bazaar',
      'more': 'More',
      'meal_rate': 'Meal Rate',
      'my_deposit': 'My Deposit',
      'my_due': 'My Due',
      'monthly_expense': 'Monthly Expense',
      'quick_actions': 'Quick Actions',
      'add_meal': '+ Meal',
      'add_expense': '+ Expense',
      'add_deposit': '+ Deposit',
      'add_bazaar': '+ Bazaar',
      'recent_activity': 'Recent Activity',
      'today_meals': "Today's Meals",
      'breakfast': 'Breakfast',
      'lunch': 'Lunch',
      'dinner': 'Dinner',
      'total': 'Total',
      'submit': 'Submit',
      'cancel': 'Cancel',
      'save': 'Save',
      'logout': 'Log Out',
      'language': 'Language',
      'theme': 'Theme',
      'members': 'Members',
      'my_mess': 'My Mess',
      'analytics': 'Analytics',
      'notifications': 'Notifications',
      'profile': 'Profile',
      'settings': 'Settings',
      'invite_code': 'Invite Code',
      'copy_code': 'Copy Code',
      'join_mess': 'Join Mess',
      'create_mess': 'Create Mess',
      'offline_msg': "You're offline. Check your internet connection.",
      'amount': 'Amount',
      'category': 'Category',
      'date': 'Date',
      'description': 'Description',
      'method': 'Payment Method',
      'bKash': 'bKash',
      'Nagad': 'Nagad',
      'Rocket': 'Rocket',
      'Cash': 'Cash',
    },
  };

  String get(String key) {
    final lang = locale.languageCode;
    return _localizedValues[lang]?[key] ?? _localizedValues['bn']?[key] ?? key;
  }
}

class AppL10nDelegate extends LocalizationsDelegate<AppL10n> {
  const AppL10nDelegate();

  @override
  bool isSupported(Locale locale) => ['bn', 'en'].contains(locale.languageCode);

  @override
  Future<AppL10n> load(Locale locale) async {
    return AppL10n(locale);
  }

  @override
  bool shouldReload(AppL10nDelegate old) => false;
}
