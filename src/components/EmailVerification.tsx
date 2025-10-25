import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Mail, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailVerificationProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function EmailVerification({ onSuccess, onBack }: EmailVerificationProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token and userId from URL hash
        const hash = window.location.hash.substring(1); // Remove #
        const params = new URLSearchParams(hash.split('?')[1]);
        const token = params.get('token');
        const userId = params.get('userId');

        console.log('Verification params:', { token, userId });

        if (!token || !userId) {
          setStatus('error');
          setMessage('Lien de vérification invalide. Veuillez réessayer.');
          setLoading(false);
          return;
        }

        // In a real implementation, you would:
        // 1. Check if the token is valid in your database
        // 2. Check if the token hasn't expired
        // 3. Mark the user's email as verified

        // For now, we'll just mark it as successful
        // You should add a verification_tokens table to track these

        const { data: seller, error: sellerError } = await supabase
          .from('sellers')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (sellerError || !seller) {
          setStatus('error');
          setMessage('Utilisateur introuvable. Veuillez contacter le support.');
          setLoading(false);
          return;
        }

        // Update seller to mark email as verified
        const { error: updateError } = await supabase
          .from('sellers')
          .update({
            email_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating seller:', updateError);
          setStatus('error');
          setMessage('Erreur lors de la vérification. Veuillez réessayer.');
          setLoading(false);
          return;
        }

        setStatus('success');
        setMessage('Votre email a été vérifié avec succès!');
        setLoading(false);

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          onSuccess();
        }, 3000);

      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Une erreur est survenue lors de la vérification.');
        setLoading(false);
      }
    };

    verifyEmail();
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {loading && (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <Loader className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-white" />
              </div>
            )}
            {status === 'expired' && (
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-white" />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            {loading && 'Vérification en cours...'}
            {status === 'success' && 'Email vérifié!'}
            {status === 'error' && 'Erreur de vérification'}
            {status === 'expired' && 'Lien expiré'}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            {loading && 'Veuillez patienter pendant que nous vérifions votre adresse email...'}
            {status === 'success' && message}
            {status === 'error' && message}
            {status === 'expired' && 'Ce lien de vérification a expiré. Veuillez demander un nouveau lien de vérification.'}
          </p>

          {/* Additional info for success */}
          {status === 'success' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-800 text-center">
                Redirection vers votre tableau de bord dans quelques secondes...
              </p>
            </div>
          )}

          {/* Action buttons */}
          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={onBack}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Retour à la connexion
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Réessayer
              </button>
            </div>
          )}

          {status === 'expired' && (
            <div className="space-y-3">
              <button
                onClick={onBack}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Demander un nouveau lien
              </button>
            </div>
          )}

          {status === 'success' && (
            <button
              onClick={onSuccess}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
            >
              Continuer vers le tableau de bord
            </button>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Besoin d'aide?{' '}
            <a href="mailto:support@omnia.sale" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
