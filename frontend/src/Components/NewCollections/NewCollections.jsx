import React, { useEffect ,useState} from 'react'
import './NewCollections.css'
import Item from '../Item/Item'

const NewCollections = () => {

  const[new_collection,setNew_collection] = useState([]);

  useEffect(()=>{
    fetch('http://localhost:4000/newcollections')
    .then((response)=>response.json())
    .then((data)=>setNew_collection(data));
  },[])

  return (
    <div className='new-collections'>
      <h1>Highly Rated Items</h1>
      <hr/>
      <div className="collections">
        {new_collection.map((item,i)=>{
            return <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price.toFixed(2)} old_price={item.old_price.toFixed(2)} />
        })}
      </div>
    </div>
  )
}

export default NewCollections
