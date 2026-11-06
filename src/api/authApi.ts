import { Platform, NativeModules } from 'react-native';
 const BASE_URL='http://192.168.0.15:8000';
// ================== BACKEND ADDRESS (AUTOMATIC) ==================
// App Metro/Expo server kadun load hote, mhanje phone la PC cha IP
// adhich mahit asto. Tochach IP backend sathi vaparto, mhanun
// PC cha IP badalla tari app madhe kahi badlaych garaj nahi.
const PC_IP_FALLBACK = '192.168.0.15'; // auto-detect fail zala tarach vapral jato
const IS_ANDROID_EMULATOR = false;     // emulator vaprat asal tr true kra
 
function detectHost(): string {
    try {
        const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
        const match = scriptURL?.match(/^https?:\/\/([^:/]+)/);
        if (match?.[1]) return match[1];
    } catch {}
    return PC_IP_FALLBACK;
}
 
// export const BASE_URL =
//     Platform.OS === 'android' && IS_ANDROID_EMULATOR
//         ? 'http://10.0.2.2:8000'
//         : 'http://192.168.0.15:8000';
 
const TIMEOUT_MS = 15000;
 
// Common request helper: timeout + clear error messages
async function request(path: string, body: unknown) {
    const url = `${BASE_URL}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
 
    try {
        console.log('API URL:', url);
 
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
 
        let data: any = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }
 
        console.log('API STATUS:', response.status, data);
 
        if (!response.ok) {
            // FastAPI validation error (422) detail ha array asto
            let message = 'Request failed';
            if (typeof data?.detail === 'string') {
                message = data.detail;
            } else if (Array.isArray(data?.detail)) {
                message = data.detail
                    .map((d: any) => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`)
                    .join('\n');
            }
            throw new Error(message);
        }
 
        return data;
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error(
                `Server is not reachable (timeout).\nURL: ${url}\ncheck the PC's IP, Wi-Fi and firewall.`,
            );
        }
        if (error?.message?.includes('Network request failed')) {
            throw new Error(
                `Unable to connect to the server.\nURL: ${url}\n\n` +
                `1) Is the backend running with --host 0.0.0.0?\n` +
                `2) Are the phone and PC connected to the same Wi-Fi network?\n` +
                `3) Is the PC's IP address correct?\n` +
                `4) Has port 8000 been allowed in Windows Firewall?`,
            );
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}
 
export const loginUser = async (email: string, password: string) => {
    return request('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
    });
};
 
// SignupScreen cha flat form -> backend la havi asleli nested JSON
export const signupUser = async (form: {
    name: string;
    username: string;
    email: string;
    password: string;
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    lat: string;
    lng: string;
    phone: string;
    website: string;
    company_name: string;
    catchPhrase: string;
    bs: string;
}) => {
    return request('/auth/signup', {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        address: {
            street: form.street.trim(),
            suite: form.suite.trim(),
            city: form.city.trim(),
            zipcode: form.zipcode.trim(),
            geo: {
                lat: form.lat.trim(),
                lng: form.lng.trim(),
            },
        },
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        company: {
            name: form.company_name.trim(),
            catchPhrase: form.catchPhrase.trim(),
            bs: form.bs.trim(),
        },
    });
};