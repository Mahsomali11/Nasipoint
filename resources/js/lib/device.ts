// Generate or retrieve a persistent device ID
export function getDeviceId(): string {
  const key = 'maaldhis_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  const platform = navigator.platform || '';

  // Try to extract specific device/browser info
  let device = 'Unknown Device';
  let browser = '';

  // Detect browser
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  // Detect device/OS
  if (/iPhone/i.test(ua)) device = 'iPhone';
  else if (/iPad/i.test(ua)) device = 'iPad';
  else if (/Android/i.test(ua) && /Mobile/i.test(ua)) device = 'Android Phone';
  else if (/Android/i.test(ua)) device = 'Android Tablet';
  else if (/Macintosh|Mac OS/i.test(ua)) device = 'Mac';
  else if (/Windows/i.test(ua)) device = 'Windows PC';
  else if (/Linux/i.test(ua)) device = 'Linux PC';
  else if (/CrOS/i.test(ua)) device = 'Chromebook';

  return browser ? `${device} (${browser})` : device;
}

export function getDeviceType(): string {
  const ua = navigator.userAgent;
  // Check tablet first (some tablets report as mobile)
  if (/iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
  if (/Mobi|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  return 'Unknown';
}

export function getOperatingSystem(): string {
  const ua = navigator.userAgent;
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  }
  if (/iPhone OS/i.test(ua)) {
    const match = ua.match(/iPhone OS (\d+_\d+)/);
    return match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
  }
  if (/Android (\d+)/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  if (/CrOS/i.test(ua)) return 'Chrome OS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}
