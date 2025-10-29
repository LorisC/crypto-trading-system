import { describe, expect, it } from 'vitest';
import { OrderBookSnapshotVo } from '@/domain/value-objects/order-book-snapshot.vo';
import { OrderBookLevel } from '@/domain/value-objects/order-book-level.vo';
import { Price } from '@/domain/value-objects/price.vo';
import { Amount } from '@/domain/value-objects/amount.vo';
import { TradingPair } from '@/domain/value-objects/tading-pair.vo';
import { Asset } from '@/domain/value-objects/asset.vo';
import { Timestamp } from '@/domain/value-objects/timestamp.vo';
import { InvalidValueObjectException } from '@/domain/exceptions';
import { AssetType } from '@domain/enum';

describe('OrderBookSnapshot Value Object', () => {
  const btc = Asset.from('BTC', AssetType.CRYPTOCURRENCY);
  const usdt = Asset.from('USDT', AssetType.STABLECOIN);
  const pair = TradingPair.from(btc, usdt);
  const timestamp = Timestamp.now();

  const createBid = (price: number, quantity: number) => {
    return OrderBookLevel.from(Price.from(price, pair), Amount.from(quantity, btc));
  };

  const createAsk = (price: number, quantity: number) => {
    return OrderBookLevel.from(Price.from(price, pair), Amount.from(quantity, btc));
  };

  describe('creation', () => {
    it('should create valid order book snapshot', () => {
      const bids = [createBid(49900, 1), createBid(49800, 2)];
      const asks = [createAsk(50100, 1), createAsk(50200, 2)];

      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      expect(snapshot.getPair().equals(pair)).toBe(true);
      expect(snapshot.getTimestamp().equals(timestamp)).toBe(true);
      expect(snapshot.getBids().length).toBe(2);
      expect(snapshot.getAsks().length).toBe(2);
    });

    it('should sort bids in descending order', () => {
      const bids = [
        createBid(49800, 1),
        createBid(49900, 2),
        createBid(49700, 1.5),
      ];
      const asks = [createAsk(50100, 1)];

      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);
      const sortedBids = snapshot.getBids();

      expect(sortedBids[0].getPrice().value).toBe(49900); // Highest first
      expect(sortedBids[1].getPrice().value).toBe(49800);
      expect(sortedBids[2].getPrice().value).toBe(49700);
    });

    it('should sort asks in ascending order', () => {
      const bids = [createBid(49900, 1)];
      const asks = [
        createAsk(50200, 2),
        createAsk(50100, 1),
        createAsk(50300, 1.5),
      ];

      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);
      const sortedAsks = snapshot.getAsks();

      expect(sortedAsks[0].getPrice().value).toBe(50100); // Lowest first
      expect(sortedAsks[1].getPrice().value).toBe(50200);
      expect(sortedAsks[2].getPrice().value).toBe(50300);
    });

    it('should throw when bids array is empty', () => {
      const bids: OrderBookLevel[] = [];
      const asks = [createAsk(50100, 1)];

      expect(() => OrderBookSnapshotVo.from(pair, bids, asks, timestamp)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when asks array is empty', () => {
      const bids = [createBid(49900, 1)];
      const asks: OrderBookLevel[] = [];

      expect(() => OrderBookSnapshotVo.from(pair, bids, asks, timestamp)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when book is crossed (bid >= ask)', () => {
      const bids = [createBid(50100, 1)];
      const asks = [createAsk(50000, 1)]; // Ask lower than bid

      expect(() => OrderBookSnapshotVo.from(pair, bids, asks, timestamp)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when best bid equals best ask', () => {
      const bids = [createBid(50000, 1)];
      const asks = [createAsk(50000, 1)];

      expect(() => OrderBookSnapshotVo.from(pair, bids, asks, timestamp)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('best bid and ask', () => {
    it('should get best bid', () => {
      const bids = [createBid(49900, 1), createBid(49800, 2)];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const bestBid = snapshot.getBestBid();

      expect(bestBid?.getPrice().value).toBe(49900);
      expect(bestBid?.getQuantity().value).toBe(1);
    });

    it('should get best ask', () => {
      const bids = [createBid(49900, 1)];
      const asks = [createAsk(50100, 1), createAsk(50200, 2)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const bestAsk = snapshot.getBestAsk();

      expect(bestAsk?.getPrice().value).toBe(50100);
      expect(bestAsk?.getQuantity().value).toBe(1);
    });
  });

  describe('mid price and spread', () => {
    it('should calculate mid price', () => {
      const bids = [createBid(49900, 1)];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const midPrice = snapshot.getMidPrice();

      expect(midPrice?.value).toBe(50000); // (49900 + 50100) / 2
    });

    it('should calculate spread', () => {
      const bids = [createBid(49900, 1)];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const spread = snapshot.getSpread();

      expect(spread?.value).toBe(200); // 50100 - 49900
    });

    it('should calculate spread percent', () => {
      const bids = [createBid(49900, 1)];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const spreadPercent = snapshot.getSpreadPercent();

      expect(spreadPercent).toBeCloseTo(0.4, 2); // (200 / 50000) * 100
    });
  });

  describe('liquidity analysis', () => {
    it('should calculate bid liquidity for specified levels', () => {
      const bids = [
        createBid(49900, 1),
        createBid(49800, 2),
        createBid(49700, 3),
      ];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const liquidity = snapshot.getBidLiquidity(2);

      expect(liquidity.value).toBe(3); // 1 + 2
    });

    it('should calculate ask liquidity for specified levels', () => {
      const bids = [createBid(49900, 1)];
      const asks = [
        createAsk(50100, 1),
        createAsk(50200, 2),
        createAsk(50300, 3),
      ];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const liquidity = snapshot.getAskLiquidity(2);

      expect(liquidity.value).toBe(3); // 1 + 2
    });

    it('should calculate liquidity imbalance', () => {
      const bids = [createBid(49900, 3), createBid(49800, 2)];
      const asks = [createAsk(50100, 1), createAsk(50200, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const imbalance = snapshot.getLiquidityImbalance(2);

      // (5 - 2) / (5 + 2) = 3/7 ≈ 0.4286
      expect(imbalance).toBeCloseTo(0.4286, 3);
    });

    it('should return zero imbalance when liquidity is equal', () => {
      const bids = [createBid(49900, 2), createBid(49800, 1)];
      const asks = [createAsk(50100, 2), createAsk(50200, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const imbalance = snapshot.getLiquidityImbalance(2);

      expect(imbalance).toBe(0); // (3 - 3) / (3 + 3) = 0
    });

    it('should return negative imbalance when asks dominate', () => {
      const bids = [createBid(49900, 1), createBid(49800, 1)];
      const asks = [createAsk(50100, 3), createAsk(50200, 2)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const imbalance = snapshot.getLiquidityImbalance(2);

      // (2 - 5) / (2 + 5) = -3/7 ≈ -0.4286
      expect(imbalance).toBeCloseTo(-0.4286, 3);
    });
  });

  describe('market order estimation', () => {
    it('should estimate market buy cost', () => {
      const bids = [createBid(49900, 1)];
      const asks = [
        createAsk(50100, 1),
        createAsk(50200, 2),
        createAsk(50300, 3),
      ];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const estimate = snapshot.estimateMarketBuy(Amount.from(2, btc));

      expect(estimate.filledQuantity.value).toBe(2);
      expect(estimate.totalCost.value).toBe(150400); // 1*50100 + 1*50200
      expect(estimate.averagePrice.value).toBe(75200); // 150400 / 2
    });

    it('should estimate market sell proceeds', () => {
      const bids = [
        createBid(49900, 1),
        createBid(49800, 2),
        createBid(49700, 3),
      ];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const estimate = snapshot.estimateMarketSell(Amount.from(2, btc));

      expect(estimate.filledQuantity.value).toBe(2);
      expect(estimate.totalProceeds.value).toBe(99700); // 1*49900 + 1*49800
      expect(estimate.averagePrice.value).toBe(49850); // 99700 / 2
    });

    it('should handle partial fill on market buy when not enough liquidity', () => {
      const bids = [createBid(49900, 1)];
      const asks = [createAsk(50100, 1), createAsk(50200, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const estimate = snapshot.estimateMarketBuy(Amount.from(5, btc));

      expect(estimate.filledQuantity.value).toBe(2);
      expect(estimate.totalCost.value).toBe(100300); // 1*50100 + 1*50200
      expect(estimate.fullyFilled).toBe(false);
    });

    it('should handle partial fill on market sell when not enough liquidity', () => {
      const bids = [createBid(49900, 1), createBid(49800, 1)];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const estimate = snapshot.estimateMarketSell(Amount.from(5, btc));

      expect(estimate.filledQuantity.value).toBe(2);
      expect(estimate.totalProceeds.value).toBe(99700); // 1*49900 + 1*49800
      expect(estimate.fullyFilled).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should convert to string', () => {
      const bids = [createBid(49900, 1)];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const str = snapshot.toString();

      expect(str).toContain('BTC/USDT');
      expect(str).toBeDefined();
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const bids = [createBid(49900, 1), createBid(49800, 2)];
      const asks = [createAsk(50100, 1), createAsk(50200, 2)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const json = snapshot.toJSON();

      expect(json.pair).toBe('BTC/USDT');
      expect(json.timestamp).toBeDefined();
      expect(json.bids.length).toBe(2);
      expect(json.asks.length).toBe(2);
      expect(json.bids[0].price).toBe(49900);
      expect(json.asks[0].price).toBe(50100);
      expect(json.bestBid).toBe(49900);
      expect(json.bestAsk).toBe(50100);
      expect(json.midPrice).toBe(50000);
      expect(json.spread).toBe(200);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const bids = [createBid(49900, 1)];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      expect(() => {
        (snapshot as any).pair = null;
      }).toThrow();
    });

    it('should return readonly arrays', () => {
      const bids = [createBid(49900, 1)];
      const asks = [createAsk(50100, 1)];
      const snapshot = OrderBookSnapshotVo.from(pair, bids, asks, timestamp);

      const returnedBids = snapshot.getBids();
      const returnedAsks = snapshot.getAsks();

      expect(() => {
        (returnedBids as any).push(createBid(49800, 1));
      }).toThrow();

      expect(() => {
        (returnedAsks as any).push(createAsk(50200, 1));
      }).toThrow();
    });
  });
});
