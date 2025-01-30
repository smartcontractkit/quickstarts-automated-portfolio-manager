import { useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { usePublicClient, useBlockNumber } from "wagmi";
import { portfolioManagerConfig } from "../src/portfolioManagerConfig";

const useFetchRebalancingLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<Error | null>(null);
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber();

  useEffect(() => {
    const fetchLogs = async () => {
      if (!blockNumber || !publicClient) return;

      setLoadingLogs(true);
      try {
        // Calculate the number of blocks for the last 10 days
        const blocksPerDay = BigInt((60 * 60 * 24) / 12); /// 12 seconds per block for Ethereum Sepolia, adjust as needed
        const daysToFetch = 10;
        const blocksToFetch = blocksPerDay * BigInt(daysToFetch);

        // Calculate the starting block
        const fromBlock = blockNumber - blocksToFetch;

        const fetchedLogs = await publicClient.getLogs({
          address: portfolioManagerConfig.address,
          event: parseAbiItem(
            "event PortfolioRebalanced(uint256 indexed, uint256 indexed, uint256 indexed)"
          ),
          fromBlock: fromBlock,
        });

        setLogs(fetchedLogs);
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
  }, [blockNumber, publicClient]);

  return { logs, loadingLogs, logsError };
};

export default useFetchRebalancingLogs;
