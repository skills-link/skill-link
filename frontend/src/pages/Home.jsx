import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import JobCard from '../components/JobCard';
import Loading from '../components/Loading';
import heroBackground from '../../images/Gemini_Generated_Image_wzqs1ywzqs1ywzqs.png';

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
      <section className="hero-section">
        <div className="hero-text-content">
          <h1>Unlock Opportunities Through Your Skills.</h1>
          <p>
            Showcase your skills, discover opportunities.
            Connect with potential employers all on one platform.
          </p>
          <div className="hero-actions">
            <Link to="/jobs" className="hero-primary-btn">Browse Jobs</Link>
            <Link to="/register" className="hero-secondary-btn">Create Account</Link>
          </div>
        </div>
      </section>

      <section className="container py-5 recent-openings-section">
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
