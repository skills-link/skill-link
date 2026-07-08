import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import JobCard from '../components/JobCard';
import Loading from '../components/Loading';
import heroImage from '../assets/skill-link-logo.jpeg';
<img src={heroImage} alt="Skill Link Hero" className="hero-image" />

const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load a few open jobs for the landing page preview.
    api
      .get('/jobs')
      .then((res) => setJobs(res.data.jobs.slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      {/* Public landing section. It links users directly to the main workflows. */}
      <section className="hero-section">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <p className="text-primary fw-semibold mb-2"></p>
              <h1 className="display-5 fw-bold mb-3">Find talent and career opportunities in one focused workspace.</h1>
              <p  style={{ color: 'black', maxWidth: '1000px' }}>
                Employers can post openings and manage applicants while job seekers build profiles,
                upload CVs, apply for roles, and track every application.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/jobs" className="btn btn-primary btn-lg">
                  Browse Jobs
                </Link>
                <Link to="/register" className="btn btn-outline-primary btn-lg">
                  Create Account
                </Link>
              </div>
            </div>
            <div className="col-lg-5 hero-image-column">
              <div className="hero-image-wrapper">
                <img src={heroImage} alt="Skill Link Hero" className="hero-image" />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Recent jobs reuse the same JobCard component used by the browse page. */}
      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Recent Openings</h2>
          <Link to="/jobs" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="row g-3">
            {jobs.map((job) => (
              <div className="col-md-4" key={job.id}>
                <JobCard job={job} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;
