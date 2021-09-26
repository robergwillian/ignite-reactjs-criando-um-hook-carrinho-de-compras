import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';


interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CART_STORAGE = "@RocketShoes:cart";
const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    
    const storagedCart = localStorage.getItem(CART_STORAGE);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO

      //check if item is already in the cart
      const inCart = cart.find(product => product.id === productId)
      //pull the product from api
      const productInApi = (await api.get(`products/${productId}`)).data;
      //pull stock info for the product
      const productInStock = (await api.get(`stock/${productId}`)).data;


      const stockAmount = productInStock.amount

      const newAmount = inCart?.amount ? inCart?.amount + 1 : 0

      if( stockAmount < newAmount ){
        toast.error("Quantidade solicitada fora de estoque")
        return
      }

      if(inCart) {
        const updatedProductQuantity = cart.map(productItem => {
          if (productItem.id === productInApi.id){
            productItem.amount++
          }
          return productItem
        })

        setCart(updatedProductQuantity)
        localStorage.setItem(CART_STORAGE, JSON.stringify(updatedProductQuantity))
      
      } else {
        productInApi.amount = 1
        setCart([...cart, productInApi])
        localStorage.setItem(CART_STORAGE, JSON.stringify([...cart, productInApi]))
      }

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO

      const inCart = cart.find(product => product.id === productId)

      if(inCart){
      const newCart = cart.filter(product => product.id !== productId)
      setCart(newCart)
      toast.success("Item REMOVIDO com sucesso!")
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(newCart)
      )} else {
        toast.error('Erro na remoção do produto');
        return
      }
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) {
        return;
      }

      const inStock = (await api.get(`stock/${productId}`)).data;

      console.log('amount:', amount)
      console.log('instock', inStock.amount)

      
      if(amount > inStock.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart]
      const productInCart = updatedCart.find(product => product.id === productId)

      if(productInCart){

              productInCart.amount = amount
              
              setCart(updatedCart)
              localStorage.setItem( "@RocketShoes:cart", JSON.stringify(updatedCart))
      }else {
        throw Error();
      }

      
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
      return
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
  
  return context;
}
