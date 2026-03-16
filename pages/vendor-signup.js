import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorSignUp() {

const [businessName,setBusinessName] = useState("");
const [category,setCategory] = useState("");
const [handle,setHandle] = useState("");
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [profileImage,setProfileImage] = useState(null);

const [showPassword,setShowPassword] = useState(false);
const [loading,setLoading] = useState(false);
const [message,setMessage] = useState("");

const handleFileChange = (e)=>{
if(e.target.files.length > 0){
setProfileImage(e.target.files[0]);
}
};

const handleSignUp = async(e)=>{

e.preventDefault();

setMessage("");

try{

setLoading(true);

const {data:signUpData,error:signUpError} = await supabase.auth.signUp({
email,
password
});

if(signUpError) throw signUpError;

const user = signUpData.user;

let profileImageUrl = null;

if(profileImage){

const fileExt = profileImage.name.split(".").pop();
const fileName = `${user.id}/${Date.now()}.${fileExt}`;

const {error:uploadError} = await supabase.storage
.from("vendor-portfolio")
.upload(fileName,profileImage);

if(uploadError) throw uploadError;

const {data:urlData} = supabase.storage
.from("vendor-portfolio")
.getPublicUrl(fileName);

profileImageUrl = urlData.publicUrl;

}

const {error:insertError} = await supabase
.from("vendors")
.insert([
{
id:user.id,
business_name:businessName,
category:category,
handle:handle,
profile_image:profileImageUrl
}
]);

if(insertError) throw insertError;

setMessage("Account created! Please check your email to confirm your account before signing in.");

}catch(err){

setMessage(err.message);

}finally{

setLoading(false);

}

};

return(

<div style={{
maxWidth:"420px",
margin:"60px auto",
padding:"20px",
border:"1px solid #ddd",
borderRadius:"8px",
fontFamily:"Arial"
}}>

<h2 style={{textAlign:"center"}}>Vendor Sign Up</h2>

<form onSubmit={handleSignUp} style={{
display:"flex",
flexDirection:"column",
gap:"14px"
}}>

<label>Business Name</label>
<input
type="text"
value={businessName}
onChange={(e)=>setBusinessName(e.target.value)}
required
/>

<label>Category</label>
<input
type="text"
value={category}
onChange={(e)=>setCategory(e.target.value)}
required
/>

<label>Handle</label>
<input
type="text"
value={handle}
onChange={(e)=>setHandle(e.target.value)}
required
/>

<label>Email</label>
<input
type="email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
/>

<label>Password</label>

<div style={{display:"flex"}}>

<input
type={showPassword ? "text" : "password"}
value={password}
onChange={(e)=>setPassword(e.target.value)}
autoComplete="new-password"
required
style={{flex:1}}
/>

<button
type="button"
onClick={()=>setShowPassword(!showPassword)}
style={{marginLeft:"8px"}}
>
{showPassword ? "Hide" : "Show"}
</button>

</div>

<label>Profile Image</label>

<input
type="file"
onChange={handleFileChange}
/>

<button
type="submit"
disabled={loading}
style={{
padding:"10px",
background:"#0070f3",
color:"#fff",
border:"none",
borderRadius:"5px",
cursor:"pointer"
}}
>

{loading ? "Creating..." : "Create Vendor Account"}

</button>

</form>

{message && (

<p style={{
marginTop:"20px",
background:"#f4f4f4",
padding:"10px",
borderRadius:"5px"
}}>

{message}

</p>

)}

</div>

);

}
