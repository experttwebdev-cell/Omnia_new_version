import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import { useLanguage } from '../App';
import {
  Sparkles,
  Plus,
  Play,
  Pause,
  StopCircle,
  Trash2,
  Edit,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  BarChart3
} from 'lucide-react';
import { LoadingAnimation } from './LoadingAnimation';
import { CampaignWizard } from './CampaignWizard';
import { ConfirmDialog } from './ConfirmDialog';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'stopped' | 'completed';
  topic_niche: string;
  target_audience: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  articles_generated: number;
  articles_published: number;
  last_execution: string | null;
  next_execution: string | null;
  created_at: string;
  auto_publish: boolean;
}

interface ExecutionLog {
  id: string;
  execution_time: string;
  status: 'success' | 'failed' | 'partial';
  articles_generated: number;
  error_message: string | null;
}

export function AiCampaigns() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ show: false, title: '', message: '', action: () => {} });
  const [executionLogs, setExecutionLogs] = useState<{ [key: string]: ExecutionLog[] }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);

      if (data && data.length > 0) {
        for (const campaign of data) {
          await fetchExecutionLogs(campaign.id);
        }
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionLogs = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_execution_log')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('execution_time', { ascending: false })
        .limit(5);

      if (error) throw error;
      setExecutionLogs(prev => ({ ...prev, [campaignId]: data || [] }));
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleUpdateStatus = async (campaignId: string, newStatus: Campaign['status']) => {
    try {
      setError('');
      const { error } = await supabase
        .from('blog_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;
      setSuccess(`Campaign ${newStatus} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchCampaigns();
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError('Failed to update campaign status');
    }
  };

  const handleDelete = async (campaignId: string) => {
    try {
      setError('');
      const { error } = await supabase
        .from('blog_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      setSuccess('Campaign deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign');
    }
  };

  const handleRunNow = async (campaignId: string) => {
    try {
      setError('');
      setSuccess('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/execute-campaign`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ campaign_id: campaignId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute campaign');
      }

      setSuccess('Campaign execution started!');
      setTimeout(() => setSuccess(''), 3000);
      fetchCampaigns();
    } catch (err) {
      console.error('Error executing campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute campaign');
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      active: 'bg-green-100 text-green-700 border-green-300',
      paused: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      stopped: 'bg-red-100 text-red-700 border-red-300',
      completed: 'bg-blue-100 text-blue-700 border-blue-300'
    };

    const icons = {
      draft: Clock,
      active: Play,
      paused: Pause,
      stopped: StopCircle,
      completed: CheckCircle
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingAnimation type="content" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-blue-600" />
            {t.campaigns.title}
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your automated blog content campaigns
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md"
        >
          <Plus className="w-5 h-5" />
          {t.campaigns.createCampaign}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {showWizard && (
        <CampaignWizard
          onClose={() => {
            setShowWizard(false);
            fetchCampaigns();
          }}
        />
      )}

      {confirmDialog.show && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={() => {
            confirmDialog.action();
            setConfirmDialog({ show: false, title: '', message: '', action: () => {} });
          }}
          onCancel={() => setConfirmDialog({ show: false, title: '', message: '', action: () => {} })}
        />
      )}

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.campaigns.noCampaigns}</h3>
          <p className="text-gray-600 mb-6">
            {t.campaigns.createFirst}
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create Your First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    {campaign.description && (
                      <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(campaign.start_date)}
                      </span>
                      <span>•</span>
                      <span>{campaign.frequency}</span>
                      <span>•</span>
                      <span>{campaign.topic_niche}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(showMenu === campaign.id ? null : campaign.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {showMenu === campaign.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        {campaign.status === 'active' && (
                          <button
                            onClick={() => {
                              handleUpdateStatus(campaign.id, 'paused');
                              setShowMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Pause className="w-4 h-4" />
                            Pause Campaign
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button
                            onClick={() => {
                              handleUpdateStatus(campaign.id, 'active');
                              setShowMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Resume Campaign
                          </button>
                        )}
                        {(campaign.status === 'active' || campaign.status === 'paused') && (
                          <button
                            onClick={() => {
                              handleRunNow(campaign.id);
                              setShowMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Run Now
                          </button>
                        )}
                        {campaign.status !== 'stopped' && campaign.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                show: true,
                                title: 'Stop Campaign',
                                message: 'Are you sure you want to stop this campaign? This action cannot be undone.',
                                action: () => handleUpdateStatus(campaign.id, 'stopped')
                              });
                              setShowMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                          >
                            <StopCircle className="w-4 h-4" />
                            Stop Campaign
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              show: true,
                              title: 'Delete Campaign',
                              message: 'Are you sure you want to delete this campaign? All data will be lost.',
                              action: () => handleDelete(campaign.id)
                            });
                            setShowMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Campaign
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Generated</span>
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{campaign.articles_generated}</div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Published</span>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{campaign.articles_published}</div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Last Run</span>
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{formatDate(campaign.last_execution)}</div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Next Run</span>
                      <Calendar className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{formatDate(campaign.next_execution)}</div>
                  </div>
                </div>

                {executionLogs[campaign.id] && executionLogs[campaign.id].length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Executions</h4>
                    <div className="space-y-2">
                      {executionLogs[campaign.id].slice(0, 3).map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {log.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {log.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
                            {log.status === 'partial' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                            <span className="text-gray-600">{formatDate(log.execution_time)}</span>
                          </div>
                          <span className="text-gray-800 font-medium">
                            {log.articles_generated} article{log.articles_generated !== 1 ? 's' : ''} generated
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
