'use client';

import { getAuthToken } from '../utils/cookies';

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { User } from '../types';

// Updated Product type based on your actual product structure
interface Product {
  _id: string;
  name: string;
  nameAr: string;
  activeIngredient: string;
  activeIngredientAr: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  manufacturerAr: string;
  genericName: string;
  strength: string;
  dosage: string;
  dosageAr: string;
  form: string;
  unit: string;
  packSize: string;
  route: string;
  frequency: string;
  instructions: string;
  description: string;
  descriptionAr: string;
  images: Array<{
    url: string;
    key: string;
    filename: string;
    originalName: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  barcode: string;
  registrationNumber: string;
  requiresPrescription: boolean;
  prescriptionClass: string;
  controlledSubstance: boolean;
  therapeuticClass: string;
  indication: string[];
  contraindications: string[];
  sideEffects: string[];
  drugInteractions: string[];
  warnings: string[];
  specialInstructions: string[];
  timing: string[];
  keywords: string[];
  tags: string[];
  searchTerms: string[];
  productType: string;
  isActive: boolean;
  isPopular: boolean;
  isGloballyAvailable: boolean;
  approvalStatus: string;
  rating: number;
  reviewCount: number;
  cityId: string;
  governorateId: string;
  overallAvailability: string;
  overallAvailabilityPercentage: number;
  overallLowestPrice: number;
  overallHighestPrice: number;
  overallAveragePrice: number;
  pharmacyAvailabilityPercentage: number;
  pharmacyLowestPrice: number;
  pharmacyHighestPrice: number;
  pharmacyAveragePrice: number;
  vendorAvailabilityPercentage: number;
  vendorLowestPrice: number;
  vendorHighestPrice: number;
  vendorAveragePrice: number;
  totalPharmacies: number;
  totalVendors: number;
  pharmacyStocks: PharmacyStock[];
  vendorStocks: any[];
  alternatives: string[];
  genericAlternatives: string[];
  brandAlternatives: string[];
  strengthAlternatives: string[];
  packagingOptions: string[];
  expiryWarningDays: number;
  masterDatabaseId: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface PharmacyStock {
  pharmacyId: string;
  pharmacyName: string;
  pharmacyNameAr: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  inStock: boolean;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  lastUpdated: string;
}

// Updated CartItem interface
interface CartItem {
  id: string; // Combined productId-pharmacyId
  productId: string; // _id from product
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  pharmacy: string; // pharmacy name
  pharmacyId: string;
  cityId: string;
  governorateId: string;
  image: string;
  requiresPrescription: boolean;
  inStock: boolean;
  category: string;
  subcategory: string;
  manufacturer: string;
  activeIngredient: string;
  dosage: string;
  packSize: string;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  maxQuantity: number;
  strength: string;
  form: string;
  unit: string;
  barcode: string;
}

interface PromoCode {
  code: string;
  discount: number;
  description: string;
  minOrderAmount?: number;
  maxDiscount?: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  appliedPromo?: PromoCode;
  prescriptionMetadata: Record<string, any>;
  isLoading: boolean;
  error?: string;
}

// Cart Actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; pharmacyStock?: PharmacyStock; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string } // item id
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_PROMO'; payload: PromoCode }
  | { type: 'REMOVE_PROMO' }
  | { type: 'LOAD_CART'; payload: Omit<CartState, 'isLoading' | 'error'> }
  | { type: 'ADD_PRESCRIPTION_ITEMS'; payload: { items: CartItem[]; prescriptionId: string } }
  | { type: 'REMOVE_PRESCRIPTION_ITEMS'; payload: string } // prescription id
  | { type: 'SET_PRESCRIPTION_METADATA'; payload: { prescriptionId: string; metadata: any } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined };

// Cart Context Type
interface CartContextType extends CartState {
  addItem: (product: Product, pharmacyStock?: PharmacyStock, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  getItemQuantity: (productId: string, pharmacyId: string) => number;
  isInCart: (productId: string, pharmacyId: string) => boolean;
  addPrescriptionItems: (items: CartItem[], prescriptionId: string) => void;
  removePrescriptionItems: (prescriptionId: string) => void;
  setPrescriptionMetadata: (prescriptionId: string, metadata: any) => void;
  getPrescriptionItems: (prescriptionId?: string) => CartItem[];
  getPharmacyGroups: () => Record<string, CartItem[]>;
  hasPrescriptionItems: () => boolean;
  createOrder: (deliveryAddress: any, useCredits: number) => Promise<any>;
  confirmPayment: (orderId: string) => Promise<any>;
  requestReturn: (orderId: string, items: { itemId: string; quantity: number; reason: string }[]) => Promise<any>;
  getCustomerOrders: () => Promise<any>;
  getCustomerCredits: () => Promise<any>;
  loadCartFromServer: () => Promise<void>;
}

// Available promo codes
const PROMO_CODES: Record<string, PromoCode> = {
  SAVE10: {
    code: 'SAVE10',
    discount: 0.1,
    description: '10% off your order',
    minOrderAmount: 50,
    maxDiscount: 50,
  },
  WELCOME15: {
    code: 'WELCOME15',
    discount: 0.15,
    description: '15% off for new customers',
    minOrderAmount: 100,
    maxDiscount: 75,
  },
  HEALTH20: {
    code: 'HEALTH20',
    discount: 0.2,
    description: '20% off health supplements',
    minOrderAmount: 75,
    maxDiscount: 100,
  },
};

// Initial State
const initialState: CartState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  appliedPromo: undefined,
  prescriptionMetadata: {},
  isLoading: false,
  error: undefined,
};

// Helper function to calculate cart totals
function calculateTotals(
  items: CartItem[],
  appliedPromo?: PromoCode,
): Omit<CartState, 'items' | 'appliedPromo' | 'prescriptionMetadata' | 'isLoading' | 'error'> {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate delivery fee (free delivery over 200 EGP, otherwise use individual pharmacy delivery fees)
  const pharmacyDeliveryFees = items.reduce((fees, item) => {
    if (!fees[item.pharmacyId]) {
      fees[item.pharmacyId] = item.deliveryFee;
    }
    return fees;
  }, {} as Record<string, number>);
  
  const deliveryFee = subtotal >= 200 ? 0 : Object.values(pharmacyDeliveryFees).reduce((sum, fee) => sum + fee, 0);

  // Calculate discount
  let discount = 0;
  if (appliedPromo && subtotal >= (appliedPromo.minOrderAmount || 0)) {
    discount = Math.min(subtotal * appliedPromo.discount, appliedPromo.maxDiscount || Infinity);
  }

  const total = subtotal + deliveryFee - discount;

  return {
    totalItems,
    subtotal,
    deliveryFee,
    discount,
    total,
  };
}

// Helper function to create cart item from product and pharmacy stock
function createCartItem(product: Product, pharmacyStock: PharmacyStock | null, quantity: number = 1): CartItem {
  console.log('Creating cart item for product:', product.name);
  console.log('Pharmacy stock provided:', pharmacyStock);
  console.log('Product pharmacy stocks:', product.pharmacyStocks);
  
  // If no pharmacy stock is provided, use the first available one or create default values
  let stockData: PharmacyStock;
  
  if (!pharmacyStock) {
    console.log('No pharmacy stock provided');
    // Try to use the first pharmacy stock from the product
    if (product.pharmacyStocks && product.pharmacyStocks.length > 0) {
      stockData = product.pharmacyStocks[0];
      console.log('Using first pharmacy stock:', stockData);
    } else {
      console.log('No pharmacy stocks available, creating default');
      // Create default pharmacy stock data
      stockData = {
        pharmacyId: 'default',
        pharmacyName: 'Default Pharmacy',
        pharmacyNameAr: 'صيدلية افتراضية',
        price: product.overallLowestPrice || 0,
        originalPrice: product.overallHighestPrice || 0,
        quantity: 99,
        inStock: product.overallAvailability === 'in-stock',
        deliveryFee: 15,
        estimatedDeliveryTime: '2-3 hours',
        lastUpdated: new Date().toISOString(),
      };
    }
  } else {
    stockData = pharmacyStock;
    console.log('Using provided pharmacy stock:', stockData);
  }
  
  const cartItem: CartItem = {
    id: `${product._id}-${stockData.pharmacyId}`,
    productId: product._id,
    name: product.name,
    nameAr: product.nameAr,
    price: stockData.price,
    originalPrice: stockData.originalPrice,
    quantity,
    pharmacy: stockData.pharmacyName,
    pharmacyId: stockData.pharmacyId,
    cityId: product.cityId,
    governorateId: product.governorateId,
    image: product.images?.[0]?.url || '/placeholder-medicine.png',
    requiresPrescription: product.requiresPrescription,
    inStock: stockData.inStock,
    category: product.category,
    subcategory: product.subcategory,
    manufacturer: product.manufacturer,
    activeIngredient: product.activeIngredient,
    dosage: product.dosage,
    packSize: product.packSize,
    deliveryFee: stockData.deliveryFee,
    estimatedDeliveryTime: stockData.estimatedDeliveryTime,
    maxQuantity: stockData.quantity,
    strength: product.strength,
    form: product.form,
    unit: product.unit,
    barcode: product.barcode,
  };
  
  console.log('Created cart item:', cartItem);
  return cartItem;
}

// Cart Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  console.log('Cart reducer action:', action.type, action.payload);
  console.log('Current cart state:', state);
  
  switch (action.type) {
    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload,
      };
    }

    case 'ADD_ITEM': {
      const { product, pharmacyStock, quantity = 1 } = action.payload;
      
      console.log('Adding item to cart');
      console.log('Product:', product);
      console.log('Pharmacy stock:', pharmacyStock);
      console.log('Quantity:', quantity);
      
      // Validate product data
      if (!product || !product._id) {
        console.error('Invalid product data:', product);
        return state;
      }
      
      // Determine which pharmacy stock to use
      let stockData = pharmacyStock;
      if (!stockData && product.pharmacyStocks && product.pharmacyStocks.length > 0) {
        stockData = product.pharmacyStocks[0];
        console.log('Using first available pharmacy stock:', stockData);
      }
      
      // Validate stock data
      if (!stockData) {
        console.log('No valid stock data found, creating default');
      }
      
      const itemId = stockData 
        ? `${product._id}-${stockData.pharmacyId}` 
        : `${product._id}-default`;
      
      console.log('Generated item ID:', itemId);

      const existingItemIndex = state.items.findIndex((item) => item.id === itemId);
      console.log('Existing item index:', existingItemIndex);

      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        console.log('Updating existing item quantity');
        const existingItem = state.items[existingItemIndex];
        const newQuantity = Math.min(existingItem.quantity + quantity, existingItem.maxQuantity || 99);
        console.log(`Quantity change: ${existingItem.quantity} -> ${newQuantity}`);
        
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: newQuantity }
            : item,
        );
      } else {
        // Add new item
        console.log('Adding new item to cart');
        try {
          const newItem = createCartItem(product, stockData, quantity);
          newItems = [...state.items, newItem];
          console.log('Successfully created new item');
        } catch (error) {
          console.error('Error creating cart item:', error);
          return state;
        }
      }

      console.log('Calculating totals for items:', newItems.length);
      const totals = calculateTotals(newItems, state.appliedPromo);
      console.log('Calculated totals:', totals);

      const newState = {
        ...state,
        items: newItems,
        ...totals,
      };
      
      console.log('New cart state:', newState);
      return newState;
    }

    case 'REMOVE_ITEM': {
      console.log('Removing item:', action.payload);
      const newItems = state.items.filter((item) => item.id !== action.payload);
      const totals = calculateTotals(newItems, state.appliedPromo);

      return {
        ...state,
        items: newItems,
        ...totals,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      console.log(`Updating quantity for ${id}: ${quantity}`);

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        console.log('Removing item due to zero quantity');
        const newItems = state.items.filter((item) => item.id !== id);
        const totals = calculateTotals(newItems, state.appliedPromo);

        return {
          ...state,
          items: newItems,
          ...totals,
        };
      }

      const newItems = state.items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity || 99) }
          : item,
      );

      const totals = calculateTotals(newItems, state.appliedPromo);

      return {
        ...state,
        items: newItems,
        ...totals,
      };
    }

    case 'CLEAR_CART': {
      console.log('Clearing cart');
      return {
        ...initialState,
        isLoading: state.isLoading,
        error: state.error,
      };
    }

    case 'APPLY_PROMO': {
      console.log('Applying promo code:', action.payload);
      const totals = calculateTotals(state.items, action.payload);

      return {
        ...state,
        appliedPromo: action.payload,
        ...totals,
      };
    }

    case 'REMOVE_PROMO': {
      console.log('Removing promo code');
      const totals = calculateTotals(state.items);

      return {
        ...state,
        appliedPromo: undefined,
        ...totals,
      };
    }

    case 'LOAD_CART': {
      console.log('Loading cart from storage:', action.payload);
      return {
        ...action.payload,
        isLoading: false,
        error: undefined,
      };
    }

    case 'ADD_PRESCRIPTION_ITEMS': {
      const { items: prescriptionItems, prescriptionId } = action.payload;
      console.log('Adding prescription items:', prescriptionItems.length);

      // Remove any existing items from the same prescription
      const filteredItems = state.items.filter(
        (item) => !item.id.includes(`prescription-${prescriptionId}`),
      );

      // Add new prescription items
      const newItems = [...filteredItems, ...prescriptionItems];
      const totals = calculateTotals(newItems, state.appliedPromo);

      return {
        ...state,
        items: newItems,
        ...totals,
      };
    }

    case 'REMOVE_PRESCRIPTION_ITEMS': {
      const prescriptionId = action.payload;
      console.log('Removing prescription items:', prescriptionId);
      const newItems = state.items.filter(
        (item) => !item.id.includes(`prescription-${prescriptionId}`),
      );
      const totals = calculateTotals(newItems, state.appliedPromo);

      return {
        ...state,
        items: newItems,
        ...totals,
      };
    }

    case 'SET_PRESCRIPTION_METADATA': {
      const { prescriptionId, metadata } = action.payload;
      console.log('Setting prescription metadata:', prescriptionId);
      return {
        ...state,
        prescriptionMetadata: {
          ...state.prescriptionMetadata,
          [prescriptionId]: metadata,
        },
      };
    }

    default:
      console.log('Unknown action type:', action.type);
      return state;
  }
}

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider Component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  // API base URL - with better fallback handling
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // API helper function wrapped in useCallback to prevent dependency issues
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (typeof window === 'undefined') {
      throw new Error('API calls can only be made from the client side');
    }

    const token = getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [API_BASE_URL]);

  // Load cart from server
  const loadCartFromServer = useCallback(async () => {
    // if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: undefined });
      
      const response = await apiCall('/cart');
      if (response.success && response.data) {
        // Convert server cart format to local cart format
        const serverCart = response.data;
        const cartItems: CartItem[] = serverCart.items?.map((item: any) => ({
          id: `${item.productId._id}-${item.pharmacyId}`,
          productId: item.productId._id,
          name: item.productName || item.productId.name,
          nameAr: item.productId.nameAr || '',
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: item.quantity,
          pharmacy: item.pharmacyName,
          pharmacyId: item.pharmacyId,
          cityId: item.productId.cityId || '',
          governorateId: item.productId.governorateId || '',
          image: item.image || (item.productId.images && item.productId.images.length > 0 ? item.productId.images[0].url : '/placeholder-medicine.png'),
          requiresPrescription: item.productId.requiresPrescription || false,
          inStock: true,
          category: item.productId.category || '',
          subcategory: item.productId.subcategory || '',
          manufacturer: item.productId.manufacturer || '',
          activeIngredient: item.productId.activeIngredient || '',
          dosage: item.productId.dosage || '',
          packSize: item.productId.packSize || '',
          deliveryFee: 15, // Default delivery fee
          estimatedDeliveryTime: '2-3 hours',
          maxQuantity: 99,
          strength: item.productId.strength || '',
          form: item.productId.form || '',
          unit: item.productId.unit || '',
          barcode: item.productId.barcode || '',
          prescription:item.prescription
        })) || [];

        const totals = calculateTotals(cartItems);
        console.log(response, 'cart items saad')
        dispatch({ 
          type: 'LOAD_CART', 
          payload: {
            items: cartItems,
            appliedPromo: undefined,
            prescriptionMetadata: {},
            ...totals,
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading cart from server:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, apiCall]);

  // Save cart to localStorage whenever it changes (for non-authenticated users)
  useEffect(() => {
    if (typeof window === 'undefined' || user) return; // Don't save to localStorage when authenticated

    try {
      console.log('Saving cart to localStorage:', state);
      localStorage.setItem('cura_cart', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state, user]);

  // Add item to cart with API sync
  const addItem = useCallback(async (product: Product, pharmacyStock?: PharmacyStock, quantity: number = 1) => {
    console.log('addItem called with:');
    console.log('Product:', product);
    console.log('Pharmacy stock:', pharmacyStock);
    console.log('Quantity:', quantity);
    
    // Validate inputs
    if (!product) {
      console.error('Product is required');
      return;
    }
    
    if (!product._id) {
      console.error('Product ID is missing');
      return;
    }
    
    if (quantity <= 0) {
      console.error('Quantity must be positive');
      return;
    }
    
    // If no pharmacy stock provided, try to use the first available one
    if (!pharmacyStock && product.pharmacyStocks && product.pharmacyStocks.length > 0) {
      pharmacyStock = product.pharmacyStocks[0];
      console.log('No pharmacy stock provided, using first available:', pharmacyStock);
    }

    // Optimistic update - update local state first
    try {
      dispatch({ type: 'ADD_ITEM', payload: { product, pharmacyStock, quantity } });
      console.log('Item added to local cart');
      
      // Sync with server if user is authenticated
      if (user && pharmacyStock) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          dispatch({ type: 'SET_ERROR', payload: undefined });
          console.log('adding stock',pharmacyStock)
          const response = await apiCall('/cart/add', {
            method: 'POST',
            body: JSON.stringify({
              productId: product._id,
              pharmacyId: pharmacyStock.pharmacyId || pharmacyStock.id,
              quantity,
              price: pharmacyStock.price,
              productName: product.name,
              pharmacyName: pharmacyStock.pharmacyName || pharmacyStock.providerName,
              image: product.images?.[0]?.url || '/placeholder-medicine.png',
            }),
          });

          if (!response.success) {
            throw new Error(response.message);
          }
          
          console.log('Item synced with server');
        } catch (error: any) {
          console.error('Error syncing add item with server:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          // TODO: You might want to revert the optimistic update here
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  }, [user, apiCall]);

  // Remove item from cart with API sync
  const removeItem = useCallback(async (itemId: string) => {
    console.log('Removing item:', itemId);
    
    // Find the item to get productId and pharmacyId
    const item = state.items.find(item => item.id === itemId);
    if (!item) {
      console.error('Item not found in cart:', itemId);
      return;
    }

    // Optimistic update - update local state first
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    console.log('Item removed from local cart');

    // Sync with server if user is authenticated
    if (user) {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: undefined });
        
        const response = await apiCall('/cart/remove', {
          method: 'DELETE',
          body: JSON.stringify({
            productId: item.productId,
            pharmacyId: item.pharmacyId,
          }),
        });

        if (!response.success) {
          throw new Error(response.message);
        }
        
        console.log('Item removal synced with server');
      } catch (error: any) {
        console.error('Error syncing remove item with server:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        // TODO: You might want to revert the optimistic update here
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [state.items, user, apiCall]);

  // Update item quantity with API sync
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    console.log(`Updating quantity for ${itemId}: ${quantity}`);
    
    // Find the item to get productId and pharmacyId
    const item = state.items.find(item => item.id === itemId);
    if (!item) {
      console.error('Item not found in cart:', itemId);
      return;
    }

    // Optimistic update - update local state first
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
    console.log('Item quantity updated in local cart');

    // Sync with server if user is authenticated
    if (user) {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: undefined });
        
        const response = await apiCall('/cart/update', {
          method: 'PUT',
          body: JSON.stringify({
            productId: item.productId,
            pharmacyId: item.pharmacyId,
            quantity,
          }),
        });

        if (!response.success) {
          throw new Error(response.message);
        }
        
        console.log('Item quantity update synced with server');
      } catch (error: any) {
        console.error('Error syncing quantity update with server:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        // TODO: You might want to revert the optimistic update here
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [state.items, user, apiCall]);

  // Clear entire cart with API sync
  const clearCart = useCallback(async () => {
    console.log('Clearing cart');
    
    // Optimistic update - update local state first
    dispatch({ type: 'CLEAR_CART' });
    console.log('Cart cleared locally');

    // Sync with server if user is authenticated
    if (user) {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: undefined });
        
        const response = await apiCall('/cart/clear', {
          method: 'DELETE',
        });

        if (!response.success) {
          throw new Error(response.message);
        }
        
        console.log('Cart clear synced with server');
      } catch (error: any) {
        console.error('Error syncing cart clear with server:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        // TODO: You might want to revert the optimistic update here
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [user, apiCall]);

  // Apply promo code (local only - no API sync needed)
  const applyPromoCode = useCallback((code: string): boolean => {
    console.log('Applying promo code:', code);
    const promoCode = PROMO_CODES[code.toUpperCase()];
    if (promoCode && state.subtotal >= (promoCode.minOrderAmount || 0)) {
      dispatch({ type: 'APPLY_PROMO', payload: promoCode });
      console.log('Promo code applied successfully');
      return true;
    }
    console.log('Invalid promo code or minimum order not met');
    return false;
  }, [state.subtotal]);

  // Remove promo code (local only)
  const removePromoCode = useCallback(() => {
    console.log('Removing promo code');
    dispatch({ type: 'REMOVE_PROMO' });
  }, []);

  // Get quantity of specific item in cart
  const getItemQuantity = useCallback((productId: string, pharmacyId: string): number => {
    const item = state.items.find(
      (item) => item.productId === productId && item.pharmacyId === pharmacyId,
    );
    return item ? item.quantity : 0;
  }, [state.items]);

  // Check if item is in cart
  const isInCart = useCallback((productId: string, pharmacyId: string): boolean => {
    return state.items.some(
      (item) => item.productId === productId && item.pharmacyId === pharmacyId,
    );
  }, [state.items]);

  // Add prescription items to cart
  const addPrescriptionItems = useCallback((items: CartItem[], prescriptionId: string) => {
    console.log('Adding prescription items:', items.length);
    dispatch({ type: 'ADD_PRESCRIPTION_ITEMS', payload: { items, prescriptionId } });
  }, []);

  // Remove prescription items from cart
  const removePrescriptionItems = useCallback((prescriptionId: string) => {
    console.log('Removing prescription items:', prescriptionId);
    dispatch({ type: 'REMOVE_PRESCRIPTION_ITEMS', payload: prescriptionId });
  }, []);

  // Set prescription metadata
  const setPrescriptionMetadata = useCallback((prescriptionId: string, metadata: any) => {
    console.log('Setting prescription metadata:', prescriptionId);
    dispatch({ type: 'SET_PRESCRIPTION_METADATA', payload: { prescriptionId, metadata } });
  }, []);

  // Get prescription items
  const getPrescriptionItems = useCallback((prescriptionId?: string): CartItem[] => {
    if (prescriptionId) {
      return state.items.filter((item) => item.id.includes(`prescription-${prescriptionId}`));
    }
    return state.items.filter((item) => item.requiresPrescription);
  }, [state.items]);

  // Group items by pharmacy
  const getPharmacyGroups = useCallback((): Record<string, CartItem[]> => {
    const groups: Record<string, CartItem[]> = {};
    state.items.forEach((item) => {
      if (!groups[item.pharmacyId]) {
        groups[item.pharmacyId] = [];
      }
      groups[item.pharmacyId].push(item);
    });
    return groups;
  }, [state.items]);

  // Check if cart has prescription items
  const hasPrescriptionItems = useCallback((): boolean => {
    return state.items.some((item) => item.requiresPrescription);
  }, [state.items]);

  // API Integration Functions
  const createOrder = useCallback(async (deliveryAddress: any, useCredits: number) => {
    console.log('creating order', state.items)

    const selectedItems = state.items.map(item => ({
      medicineId: item.productId,
      pharmacyId: item.pharmacyId,
      quantity: item.quantity,
      price: item.price,
      pharmacyName:item.pharmacy,
      prescription:item.prescription
    }));
    console.log(selectedItems)
    const payload = {
      items: selectedItems,
      deliveryAddress,
      useCredits,
      prescriptionVerified:selectedItems.prescription ? true : false
    };

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: undefined });
      
      const response = await apiCall('/orders/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Clear the cart after a successful order (both locally and on server)
      await clearCart();

      return { success: true, order: response.data };
    } catch (error: any) {
      console.error('Order creation failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.items, apiCall, clearCart]);

  const confirmPayment = useCallback(async (orderId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: undefined });
      
      const response = await apiCall(`/orders/${orderId}/confirm-payment`, {
        method: 'POST',
      });
      return { success: true, creditsEarned: response.creditsEarned };
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiCall]);

  const requestReturn = useCallback(async (orderId: string, items: { itemId: string; quantity: number; reason: string }[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: undefined });
      
      const payload = { items };
      const response = await apiCall(`/orders/${orderId}/return-request`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, refundAmount: response.refundAmount };
    } catch (error: any) {
      console.error('Return request failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiCall]);

  const getCustomerOrders = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: undefined });
      
      const response = await apiCall('/orders/');
      console.log(response);
      return { success: true, orders: response.data };
    } catch (error: any) {
      console.error('Failed to fetch customer orders:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiCall]);

  const getCustomerCredits = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: undefined });
      
      const response = await apiCall('/orders/my-credits');
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Failed to fetch customer credits:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiCall]);

  const value: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode,
    getItemQuantity,
    isInCart,
    addPrescriptionItems,
    removePrescriptionItems,
    setPrescriptionMetadata,
    getPrescriptionItems,
    getPharmacyGroups,
    hasPrescriptionItems,
    createOrder,
    confirmPayment,
    requestReturn,
    getCustomerOrders,
    getCustomerCredits,
    loadCartFromServer,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Export types for use in other components
export type { Product, PharmacyStock, CartItem, PromoCode, CartState };
