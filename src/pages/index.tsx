/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { getPrismicClient, prismicAccessToken } from '../services/prismic';

import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([] as Post[]);
  const [nextPage, setNextPage] = useState<string | null>(null);

  useEffect(() => {
    setPosts(
      postsPagination.results.map(post => {
        return {
          ...post,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
        };
      })
    );
    setNextPage(postsPagination.next_page);
  }, []);

  async function handleMorePostsButton(): Promise<void> {
    const response = await fetch(
      `${nextPage}&access_token=${prismicAccessToken}`
    );

    const prismicQuery: PostPagination = await response.json();

    const newPosts = prismicQuery.results.map(post => {
      return {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setPosts(posts.concat(newPosts));
    setNextPage(prismicQuery.next_page);
  }

  return (
    <>
      <Head>
        <title>SpaceTraveler | Posts</title>
      </Head>
      <main className={commonStyles.container}>
        <Header />
        <div className={styles.posts}>
          {posts.map(post => {
            return (
              <div className={styles.post} key={post.uid}>
                <Link href={`/post/${post.uid}`}>
                  <a>
                    <strong>{post.data.title}</strong>
                  </a>
                </Link>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <div>
                    <FiCalendar />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div>
                    <FiUser />
                    <p>{post.data.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {nextPage && (
            <button
              type="button"
              onClick={handleMorePostsButton}
              className={styles.morePosts}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        author: post.data.author,
        subtitle: post.data.subtitle,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
