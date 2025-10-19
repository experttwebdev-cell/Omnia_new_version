import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  product_snapshot: {
    title: string;
    image_url?: string;
    category?: string;
    handle?: string;
    shop_name?: string;
  };
}

export interface Cart {
  id: string;
  session_id: string;
  store_id?: string;
  user_email?: string;
  status: 'active' | 'abandoned' | 'converted' | 'expired';
  total_amount: number;
  currency: string;
  discount_code?: string;
  discount_amount: number;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  addToCart: (product: any, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

function generateSessionId(): string {
  let sessionId = localStorage.getItem('omniachat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('omniachat_session_id', sessionId);
  }
  return sessionId;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(generateSessionId());

  const loadCart = async () => {
    try {
      setLoading(true);

      const { data: cartData, error: cartError } = await supabase
        .from('shopping_carts')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cartError && cartError.code !== 'PGRST116') {
        throw cartError;
      }

      if (!cartData) {
        const { data: storeData } = await supabase
          .from('shopify_stores')
          .select('id, currency')
          .limit(1)
          .maybeSingle();

        const { data: newCart, error: createError } = await supabase
          .from('shopping_carts')
          .insert({
            session_id: sessionId,
            store_id: storeData?.id,
            status: 'active',
            currency: storeData?.currency || 'EUR',
            total_amount: 0,
            discount_amount: 0
          })
          .select()
          .single();

        if (createError) throw createError;

        setCart({ ...newCart, items: [] });
      } else {
        const { data: itemsData, error: itemsError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cartData.id);

        if (itemsError) throw itemsError;

        setCart({ ...cartData, items: itemsData || [] });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (product: any, quantity: number = 1) => {
    if (!cart) return;

    try {
      const existingItem = cart.items.find(item => item.product_id === product.id);

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const productSnapshot = {
          title: product.title,
          image_url: product.image_url,
          category: product.category,
          handle: product.handle,
          shop_name: product.shop_name
        };

        const { data: newItem, error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: product.id,
            quantity,
            unit_price: Number(product.price),
            total_price: Number(product.price) * quantity,
            currency: product.currency || 'EUR',
            product_snapshot: productSnapshot
          })
          .select()
          .single();

        if (error) throw error;

        setCart(prev => prev ? {
          ...prev,
          items: [...prev.items, newItem]
        } : null);
      }

      await refreshCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!cart) return;

    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

      setCart(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, quantity, total_price: item.unit_price * quantity }
            : item
        )
      } : null);

      await refreshCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!cart) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCart(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      } : null);

      await refreshCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!cart) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;

      setCart(prev => prev ? { ...prev, items: [], total_amount: 0 } : null);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const applyDiscount = async (code: string): Promise<boolean> => {
    if (!cart) return false;

    try {
      const discountAmount = 0;

      const { error } = await supabase
        .from('shopping_carts')
        .update({
          discount_code: code,
          discount_amount: discountAmount
        })
        .eq('id', cart.id);

      if (error) throw error;

      await refreshCart();
      return true;
    } catch (error) {
      console.error('Error applying discount:', error);
      return false;
    }
  };

  const refreshCart = async () => {
    if (!cart) return;

    try {
      const { data: cartData, error: cartError } = await supabase
        .from('shopping_carts')
        .select('*')
        .eq('id', cart.id)
        .single();

      if (cartError) throw cartError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id);

      if (itemsError) throw itemsError;

      setCart({ ...cartData, items: itemsData || [] });
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyDiscount,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
