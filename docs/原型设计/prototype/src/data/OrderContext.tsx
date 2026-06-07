import { createContext, useContext } from 'react';
import type { Order } from './mock';

export interface OrderContextValue {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export const OrderContext = createContext<OrderContextValue>({
  orders: [],
  setOrders: () => {},
});

export function useOrders() {
  return useContext(OrderContext);
}
