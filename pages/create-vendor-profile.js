import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function CreateVendorProfile() {

const router = useRouter()

const [handle,setHandle] = useState("")
const [business,setBusiness] = useState("")
const [category,setCategory] = useState("")
const [bio,setBio] = useState("")
const [website,setWebsite] = useState("")

const saveProfile = async () => {

const user = (await supabase.auth.getUser()).data.user

await supabase.from("vendors").insert([{
id:user.id,
handle:handle,
business_name:business,
category:category,
bio:bio,
website:website
}])

router.push("/vendor-dashboard")

}

return(

<div style={{padding:40,fontFamily:"sans-serif"}}>

<h2>Create Vendor Profile</h2>

<input
placeholder="@handle"
value={handle}
onChange={(e)=>setHandle(e.target.value)}
/>

<br/><br/>

<input
placeholder="Business Name"
value={business}
onChange={(e)=>setBusiness(e.target.value)}
/>

<br/><br/>

<input
placeholder="Category (DJ, Catering, Photography)"
value={category}
onChange={(e)=>setCategory(e.target.value)}
/>

<br/><br/>

<textarea
placeholder="Describe your services"
value={bio}
onChange={(e)=>setBio(e.target.value)}
/>

<br/><br/>

<input
placeholder="Website"
value={website}
onChange={(e)=>setWebsite(e.target.value)}
/>

<br/><br/>

<button onClick={saveProfile}>
Create Profile
</button>

</div>

)

}
