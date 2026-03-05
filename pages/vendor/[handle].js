import { supabase } from "../../lib/supabaseClient"

export async function getServerSideProps(context){

const { handle } = context.params

const { data } = await supabase
.from("vendors")
.select("*")
.eq("handle",handle)
.single()

return { props:{vendor:data}}

}

export default function VendorPage({vendor}){

if(!vendor) return <p>Vendor not found</p>

return(

<div style={{padding:40,fontFamily:"sans-serif"}}>

<h1>{vendor.business_name}</h1>

<p>{vendor.bio}</p>

{vendor.website && (
<a href={vendor.website}>Visit Website</a>
)}

</div>

)

}
