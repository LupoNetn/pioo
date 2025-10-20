import AboutSection from '../components/homeComponents/AboutSection'
import Cta from '../components/homeComponents/Cta'
import HeroSection from '../components/homeComponents/HeroSection'
import ProjectsSection from '../components/homeComponents/ProjectsSection'
import ServicesSection from '../components/homeComponents/ServicesSection'

const HomePage = () => {

 const handleGoogleLogin = () => {
  window.location.href = "http://localhost:8080/api/auth/google";
};


  return (
    <>
     <div className='text-text-primary'>
       <div className=''>
        <HeroSection />
       </div>
       {/* demo signup */}
       <div>
        <button onClick={handleGoogleLogin}>
          <p className='font-audio text-white'>Sign with google</p>
        </button>
       </div>
      <div>
        <ProjectsSection />
      </div>
      <div>
        <ServicesSection />
      </div>
      <div>
        <AboutSection />
      </div>
      <div>
        <Cta />
      </div>
    </div>
    </>
  )
}

export default HomePage
