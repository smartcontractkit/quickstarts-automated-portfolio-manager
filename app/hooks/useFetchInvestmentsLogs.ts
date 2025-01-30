import { useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { portfolioManagerConfig } from "../src/portfolioManagerConfig";

const useFetchInvestmentsLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<Error | null>(null);
  const [totalUSDCCost, setTotalUSDCCost] = useState(0);
  const [totalPMTAcquired, setTotalPMTAcquired] = useState(0);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!address || !publicClient) {
      setLogs([]);
      setTotalUSDCCost(0);
      setTotalPMTAcquired(0);
      return;
    }

    const fetchLogs = async () => {
      setLoadingLogs(true);
      let localTotalUSDCCost = 0;
      let localTotalPMTAcquired = 0;

      try {
        const fetchedLogs = await publicClient.getLogs({
          address: portfolioManagerConfig.address,
          events: [
            parseAbiItem(
              "event Invested(address indexed investor, uint256 indexed usdcAmount, uint256 indexed tokensMinted)"
            ),
            parseAbiItem(
              "event Redeemed(address indexed investor, uint256 indexed usdcAmount, uint256 indexed tokensBurned)"
            ),
          ],
          fromBlock: BigInt(5920226), // Adjust the starting block to your contract deployment block
        });

        const filteredLogs = fetchedLogs.filter(
          (log) => log.args.investor === address
        );

        filteredLogs.forEach((log) => {
          const tokensMinted =
            log.eventName === "Invested" ? Number(log.args.tokensMinted) : 0;
          const tokensBurned =
            log.eventName === "Redeemed" ? Number(log.args.tokensBurned) : 0;
          const usdcAmount = Number(log.args.usdcAmount);

          if (log.eventName === "Invested") {
            localTotalUSDCCost += usdcAmount;
            localTotalPMTAcquired += tokensMinted;
          } else if (log.eventName === "Redeemed") {
            localTotalUSDCCost -= usdcAmount;
            localTotalPMTAcquired -= tokensBurned;
          }
        });

        setLogs(filteredLogs);
        setTotalUSDCCost(localTotalUSDCCost);
        setTotalPMTAcquired(localTotalPMTAcquired);
      } catch (err) {
        if (err instanceof Error) {
          setLogsError(err);
        } else {
          setLogsError(new Error("An unknown error occurred"));
        }
        console.error("Error fetching logs:", err);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchLogs();
  }, [address, publicClient]);

  return { logs, loadingLogs, logsError, totalUSDCCost, totalPMTAcquired };
};

export default useFetchInvestmentsLogs;
