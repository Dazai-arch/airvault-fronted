import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import AirVaultDashboard from "../components/dashboard/AirVaultDashboard";

const VaultDashboard = () => {
  const { activeVault } = useVault();

  if (!activeVault) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg font-medium">No vault selected</p>
          <p className="text-gray-500 text-sm mt-2">Please select or create a vault to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <VaultTopBar username="John Doe" />
      <AirVaultDashboard hideSidebar />
    </div>
  );
};

export default VaultDashboard;