import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const authService = {
  async handleGoogleOAuth(isRegistration: boolean = false) {
    try {
      // Use the stable Expo Auth Proxy URL
      const redirectTo = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      console.log("--- SUPABASE CONFIGURATION ---");
      console.log("1. Go to Authentication > URL Configuration");
      console.log("2. Set 'Site URL' to:");
      console.log(redirectTo);
      console.log("3. Add to 'Redirect URIs':");
      console.log(redirectTo);
      console.log("------------------------------");

      // 2. Start the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // 3. Open the browser
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (res.type === 'success') {
        const { url } = res;
        
        // 4. Parse tokens from the URL fragment (#) or query (?)
        const parts = url.split('#');
        const hash = parts.length > 1 ? parts[1] : url.split('?')[1];
        const params = new URLSearchParams(hash);
        
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (!access_token || !refresh_token) {
           return { data: null, error: new Error("No session tokens returned from Supabase.") };
        }

        // 5. Establish the session
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) throw sessionError;

        // 6. Registration Pre-check logic
        if (isRegistration && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const createdAt = new Date(profile.created_at).getTime();
            const now = new Date().getTime();
            if (now - createdAt > 10000) {
              await supabase.auth.signOut();
              throw new Error("This account is already registered. Please login instead.");
            }
          }
        }

        return { data: session, error: null };
      }
      
      return { data: null, error: null };
    } catch (error: any) {
      console.error("OAuth Error:", error);
      return { data: null, error };
    }
  },

  async signInWithEmail(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signUpWithEmail(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};
